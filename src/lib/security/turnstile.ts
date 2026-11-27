export type TurnstileResult = { ok: true; skipped: boolean } | { ok: false };

export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

/**
 * يتحقق من رمز Cloudflare Turnstile في الخادم.
 * غير مضبوط ← يُتخطّى (والنموذج لا يعرض الأداة)، مع بقاء rate limit وZod. مضبوط ← فشل الاتصال يعني رفضاً.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!isTurnstileConfigured() || !secret) return { ok: true, skipped: true };
  if (!token) return { ok: false };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return { ok: false };
    const data = (await response.json()) as { success?: boolean };
    return data.success === true ? { ok: true, skipped: false } : { ok: false };
  } catch {
    return { ok: false };
  }
}
