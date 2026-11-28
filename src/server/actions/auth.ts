"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import {
  getEnabledOAuthProviders,
  isEmailLoginEnabled,
} from "@/lib/auth/providers";
import { sanitizeCallbackUrl } from "@/lib/auth/safe-redirect";
import { guardPublicForm } from "@/server/public-form-guard";
import { magicLinkSchema, oauthSignInSchema } from "@/validators/auth";

export type MagicLinkResult =
  | { ok: true }
  | {
      ok: false;
      error:
        "VALIDATION" | "DISABLED" | "SEND_FAILED" | "CAPTCHA" | "RATE_LIMIT";
      retryAfterSec?: number;
    };

/** الدخول عبر Google / Facebook / Microsoft (نموذج بسيط بحقول مخفية). */
export async function signInWithProvider(formData: FormData): Promise<void> {
  const parsed = oauthSignInSchema.safeParse({
    provider: formData.get("provider"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
    locale: formData.get("locale"),
  });
  if (!parsed.success) return;
  const { provider, callbackUrl, locale } = parsed.data;
  if (!getEnabledOAuthProviders().includes(provider)) return;
  await signIn(provider, {
    redirectTo: sanitizeCallbackUrl(callbackUrl, `/${locale}`),
  });
}

/** يطلب رابط دخول بالبريد. لا يكشف إن كان البريد مسجّلاً. */
export async function requestMagicLink(
  input: unknown,
): Promise<MagicLinkResult> {
  // قاعدة 7: Turnstile ثم rate limit ثم Zod (يمنع إغراق صناديق بريد الآخرين برسائل الدخول)
  const token =
    typeof input === "object" && input !== null
      ? (input as { turnstileToken?: unknown }).turnstileToken
      : undefined;
  const guard = await guardPublicForm(
    "login",
    typeof token === "string" ? token : undefined,
  );
  if (!guard.ok) return guard;

  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };
  if (!isEmailLoginEnabled()) return { ok: false, error: "DISABLED" };
  const { email, callbackUrl, locale } = parsed.data;
  try {
    await signIn("resend", {
      email,
      redirect: false,
      redirectTo: sanitizeCallbackUrl(callbackUrl, `/${locale}`),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "SEND_FAILED" };
    throw error;
  }
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  await signOut({ redirectTo: `/${locale}` });
}
