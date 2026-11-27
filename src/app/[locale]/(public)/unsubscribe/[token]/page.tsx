import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { UnsubscribeForm } from "@/components/forms/unsubscribe-form";
import { isLocale } from "@/i18n/routing";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// رابط شخصي بتوقيع: ديناميكي ولا يُخزَّن
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; token: string }> };

export default async function UnsubscribePage({ params }: Props) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Unsubscribe");
  const valid = verifyUnsubscribeToken(token) !== null;

  return (
    <section className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {valid ? (
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground">{t("body")}</p>
          <UnsubscribeForm token={token} />
        </div>
      ) : (
        <p role="alert" className="mt-6 text-red-700">
          {t("invalid")}
        </p>
      )}
    </section>
  );
}
