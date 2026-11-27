export type OAuthProviderId = "google" | "facebook" | "microsoft-entra-id";

export const OAUTH_PROVIDER_IDS = [
  "google",
  "facebook",
  "microsoft-entra-id",
] as const;

type Env = Record<string, string | undefined>;

/** المزوّد الذي لم تُضبط متغيراته لا يظهر زره ولا يتعطل الموقع. */
export function getEnabledOAuthProviders(
  env: Env = process.env,
): OAuthProviderId[] {
  const enabled: OAuthProviderId[] = [];
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) enabled.push("google");
  if (env.AUTH_FACEBOOK_ID && env.AUTH_FACEBOOK_SECRET)
    enabled.push("facebook");
  if (
    env.AUTH_MICROSOFT_ENTRA_ID_ID &&
    env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
    env.AUTH_MICROSOFT_ENTRA_ID_ISSUER
  ) {
    enabled.push("microsoft-entra-id");
  }
  return enabled;
}

/**
 * رابط الدخول بالبريد مفعّل عند ضبط Resend.
 * خارج الإنتاج يعمل دائماً (الرابط يُطبع في طرفية الخادم) لتسهيل التطوير المحلي.
 */
export function isEmailLoginEnabled(env: Env = process.env): boolean {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return true;
  return env.NODE_ENV !== "production";
}
