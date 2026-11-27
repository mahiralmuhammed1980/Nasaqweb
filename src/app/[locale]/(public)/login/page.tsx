import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  getEnabledOAuthProviders,
  isEmailLoginEnabled,
} from "@/lib/auth/providers";
import { sanitizeCallbackUrl } from "@/lib/auth/safe-redirect";
import { redirect } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { signInWithProvider } from "@/server/actions/auth";
import { notFound } from "next/navigation";

export const metadata: Metadata = { robots: { index: false } };

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

const PROVIDER_LABEL_KEYS = {
  google: "google",
  facebook: "facebook",
  "microsoft-entra-id": "microsoft",
} as const;

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { callbackUrl: rawCallback, error } = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(rawCallback, `/${locale}`);

  const session = await auth();
  if (session?.user) redirect({ href: callbackUrl, locale });

  const t = await getTranslations("Login");
  const providers = getEnabledOAuthProviders();
  const emailEnabled = isEmailLoginEnabled();

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">{t("subtitle")}</p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {t("errors.generic")}
        </p>
      )}

      {providers.length > 0 && (
        <div className="mt-6 space-y-3">
          {providers.map((provider) => (
            <form key={provider} action={signInWithProvider}>
              <input type="hidden" name="provider" value={provider} />
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" className="w-full">
                {t("continueWith", {
                  provider: t(`providers.${PROVIDER_LABEL_KEYS[provider]}`),
                })}
              </Button>
            </form>
          ))}
        </div>
      )}

      {providers.length > 0 && emailEnabled && (
        <p className="text-muted-foreground my-6 text-center text-sm">
          {t("or")}
        </p>
      )}

      {emailEnabled && (
        <div className={providers.length === 0 ? "mt-6" : undefined}>
          <EmailLoginForm callbackUrl={callbackUrl} />
        </div>
      )}
    </section>
  );
}
