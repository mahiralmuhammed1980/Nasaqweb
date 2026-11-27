import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CategoryManager } from "@/components/admin/category-manager";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { db } from "@/lib/db";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/categories");
  const t = await getTranslations("AdminCategories");
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true, _count: { select: { products: true } } },
  });
  const rows = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    sortOrder: c.sortOrder,
    ar: c.translations.find((x) => x.locale === "ar")?.name ?? "",
    en: c.translations.find((x) => x.locale === "en")?.name ?? "",
    products: c._count.products,
  }));
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <CategoryManager categories={rows} />
    </>
  );
}
