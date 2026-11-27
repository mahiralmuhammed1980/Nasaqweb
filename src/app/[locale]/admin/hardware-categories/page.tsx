import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CategoryManager } from "@/components/admin/category-manager";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { db } from "@/lib/db";
import {
  deleteHardwareCategory,
  saveHardwareCategory,
} from "@/server/actions/admin/hardware-categories";

export default async function AdminHardwareCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/hardware-categories");
  const t = await getTranslations("AdminHardware");
  const categories = await db.hardwareCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { hardware: true } } },
  });
  const rows = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    sortOrder: c.sortOrder,
    ar: c.translations.find((x) => x.locale === "ar")?.name ?? "",
    en: c.translations.find((x) => x.locale === "en")?.name ?? "",
    products: c._count.hardware,
  }));
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("categoriesTitle")}</h1>
      <CategoryManager
        categories={rows}
        saveAction={saveHardwareCategory}
        deleteAction={deleteHardwareCategory}
        countLabel={t("hardwareCount")}
      />
    </>
  );
}
