import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
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
        <nav aria-label={t("sidebar")} className="mt-3 flex flex-col gap-1">
          <Link
            href="/admin"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/admin/products"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.products")}
          </Link>
          <Link
            href="/admin/categories"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.categories")}
          </Link>
          <Link
            href="/admin/offers"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.offers")}
          </Link>
          <Link
            href="/admin/hardware"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.hardware")}
          </Link>
          <Link
            href="/admin/hardware-categories"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.hardwareCategories")}
          </Link>
          <Link
            href="/admin/orders"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.orders")}
          </Link>
          <Link
            href="/admin/messages"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.messages")}
          </Link>
          <Link
            href="/admin/settings"
            className="hover:bg-muted rounded px-2 py-1.5 text-sm"
          >
            {t("nav.settings")}
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
