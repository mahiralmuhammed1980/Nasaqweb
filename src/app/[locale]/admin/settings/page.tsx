import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings-form";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { getSiteSettingsFresh } from "@/server/queries/settings";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/settings");
  const [t, settings] = await Promise.all([
    getTranslations("AdminSettings"),
    getSiteSettingsFresh(),
  ]);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <SettingsForm initial={settings} />
    </>
  );
}
