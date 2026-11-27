import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin");
  const t = await getTranslations("Admin");

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside
        aria-label={t("sidebar")}
        className="border-border w-56 shrink-0 border-e pe-4"
      >
        <p className="text-muted-foreground text-sm font-semibold">
          {t("sidebar")}
        </p>
        {/* القائمة الجانبية فارغة حالياً؛ تُملأ بأقسام الإدارة في المراحل 2-6 */}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
