import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { isLocale } from "@/i18n/routing";
import { emptyProductForm } from "@/lib/admin/product-form-values";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { listCategoriesWithTranslations } from "@/server/queries/products";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/products/new");
  const t = await getTranslations("AdminProducts");
  const categories = (await listCategoriesWithTranslations()).map((c) => ({
    id: c.id,
    name: pickTranslation(c.translations, locale)?.name ?? c.slug,
  }));
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("new")}</h1>
      <ProductForm initial={emptyProductForm()} categories={categories} />
    </>
  );
}
