"use server";

import { headers } from "next/headers";
import { CONSENT_POLICY_VERSION } from "@/lib/consent";
import { db } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/request-meta";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { channelsOf, consentStateFor } from "@/server/consent";

export type UnsubscribeResult =
  { ok: true; changed: number } | { ok: false; error: "INVALID" | "FAILED" };

/**
 * إلغاء الاشتراك برابط البريد: يعمل دون تسجيل دخول، ويحميه التوقيع.
 * لكل قناة كانت موافقتها الحالية «نعم» نُضيف سجلاً جديداً granted=false (لا نعدّل سجلاً قديماً).
 */
export async function confirmUnsubscribe(
  token: string,
): Promise<UnsubscribeResult> {
  const identity = verifyUnsubscribeToken(
    typeof token === "string" ? token : "",
  );
  if (!identity) return { ok: false, error: "INVALID" };
  try {
    const state = await consentStateFor(identity);
    const targets = channelsOf(identity).filter((channel) => state[channel]);
    if (targets.length === 0) return { ok: true, changed: 0 };

    const h = await headers();
    await db.consentRecord.createMany({
      data: targets.map((channel) => ({
        userId: identity.userId ?? null,
        email: identity.email ?? null,
        phone: identity.phone ?? null,
        channel,
        granted: false,
        source: "UNSUBSCRIBE" as const,
        policyVersion: CONSENT_POLICY_VERSION,
        consentText: "Unsubscribed via signed email link",
        ipHash: hashIp(getClientIp(h)),
        userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      })),
    });
    return { ok: true, changed: targets.length };
  } catch (error) {
    console.error(
      "[unsubscribe] failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "FAILED" };
  }
}
