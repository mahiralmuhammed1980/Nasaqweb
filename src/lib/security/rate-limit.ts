import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

type Window = { limit: number; windowSec: number };

/** محدّد بالذاكرة (نافذة منزلقة). بديل عند غياب Upstash، وللاختبارات. لا يُشارَك بين نسخ الخادم. */
export function createMemoryLimiter(now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    check(key: string, { limit, windowSec }: Window): RateLimitResult {
      const cutoff = now() - windowSec * 1000;
      const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
      if (recent.length >= limit) {
        hits.set(key, recent);
        const oldest = recent[0] ?? now();
        return {
          allowed: false,
          remaining: 0,
          retryAfterSec: Math.max(
            1,
            Math.ceil((oldest + windowSec * 1000 - now()) / 1000),
          ),
        };
      }
      recent.push(now());
      hits.set(key, recent);
      return {
        allowed: true,
        remaining: limit - recent.length,
        retryAfterSec: 0,
      };
    },
  };
}

const memory = createMemoryLimiter();
const upstash = new Map<string, Ratelimit>();
let warned = false;

function getUpstash(
  bucket: string,
  { limit, windowSec }: Window,
): Ratelimit | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return null;
  const id = `${bucket}:${limit}:${windowSec}`;
  let limiter = upstash.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `rl:${bucket}`,
    });
    upstash.set(id, limiter);
  }
  return limiter;
}

/**
 * يفحص حد الطلبات لمفتاح (عادةً تجزئة IP) داخل سلة (order/contact/login).
 * Upstash عند ضبطه، وإلا الذاكرة (أضعف على Vercel لأن كل نسخة لها ذاكرتها).
 */
export async function checkRateLimit(
  bucket: string,
  key: string,
  window: Window,
): Promise<RateLimitResult> {
  const upstashLimiter = getUpstash(bucket, window);
  if (!upstashLimiter) {
    if (!warned && process.env.VERCEL_ENV === "production") {
      warned = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set: using per-instance memory limiter",
      );
    }
    return memory.check(`${bucket}:${key}`, window);
  }
  try {
    const result = await upstashLimiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfterSec: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    // تعطّل Redis لا يجب أن يوقف النماذج: نسمح ونسجّل الحادثة دون بيانات شخصية
    console.error(
      "[rate-limit] upstash failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { allowed: true, remaining: 0, retryAfterSec: 0 };
  }
}

/** حد الإرسال للنماذج العامة: 5 في الساعة لكل IP */
export const PUBLIC_FORM_LIMIT: Window = { limit: 5, windowSec: 3600 };
