import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = { robots: { index: false } };

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Login");
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("checkEmailTitle")}</h1>
      <p className="text-muted-foreground mt-3">{t("checkEmailBody")}</p>
    </section>
  );
}
