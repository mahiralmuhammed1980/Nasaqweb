/**
 * مزوّدون يُوثَّق بريدهم فعلاً، ولذلك وحدهم يجوز بهم الترقية إلى ADMIN أو ربط الحسابات.
 * Facebook وMicrosoft لا يضمنان توثيق البريد (ثغرة nOAuth وحسابات Facebook ببريد غير موثّق).
 */
export const VERIFIED_EMAIL_PROVIDERS = ["google", "resend"] as const;

export function isVerifiedEmailProvider(provider: string | undefined): boolean {
  return (
    !!provider &&
    (VERIFIED_EMAIL_PROVIDERS as readonly string[]).includes(provider)
  );
}

export function shouldPromoteToAdmin(params: {
  email: string | null | undefined;
  provider: string | undefined;
  adminEmail: string | undefined;
}): boolean {
  const { email, provider, adminEmail } = params;
  if (!email || !adminEmail) return false;
  if (!isVerifiedEmailProvider(provider)) return false;
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}
