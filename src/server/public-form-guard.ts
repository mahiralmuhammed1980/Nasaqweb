import { headers } from "next/headers";
import { getClientIp, hashIp } from "@/lib/request-meta";
import { checkRateLimit, PUBLIC_FORM_LIMIT } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

export type GuardResult =
  | { ok: true; ip: string; ipHash: string; userAgent: string | null }
  | { ok: false; error: "CAPTCHA" | "RATE_LIMIT"; retryAfterSec?: number };

/**
 * حماية كل نموذج عام (قاعدة 7): Turnstile ثم rate limit، ثم يتحقق المستدعي بـ Zod.
 * `bucket` سلة منفصلة لكل نموذج (order / contact / login).
 */
export async function guardPublicForm(
  bucket: string,
  turnstileToken: string | undefined,
): Promise<GuardResult> {
  const h = await headers();
  const ip = getClientIp(h);

  const captcha = await verifyTurnstile(turnstileToken, ip);
  if (!captcha.ok) return { ok: false, error: "CAPTCHA" };

  const ipHash = hashIp(ip);
  const limit = await checkRateLimit(bucket, ipHash, PUBLIC_FORM_LIMIT);
  if (!limit.allowed)
    return {
      ok: false,
      error: "RATE_LIMIT",
      retryAfterSec: limit.retryAfterSec,
    };

  return {
    ok: true,
    ip,
    ipHash,
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}
