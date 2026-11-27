import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { isLocale } from "@/i18n/routing";
import { productToFormValues } from "@/lib/admin/product-form-values";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { getProductForAdmin } from "@/server/queries/admin-products";
import { listCategoriesWithTranslations } from "@/server/queries/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, `/admin/products/${id}`);
  const [t, product, categories] = await Promise.all([
    getTranslations("AdminProducts"),
    getProductForAdmin(id),
    listCategoriesWithTranslations(),
  ]);
  if (!product) notFound();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">
        {t("editTitle", {
          name:
            pickTranslation(product.translations, locale)?.name ?? product.slug,
        })}
      </h1>
      <ProductForm
        initial={productToFormValues(product)}
        categories={categories.map((c) => ({
          id: c.id,
          name: pickTranslation(c.translations, locale)?.name ?? c.slug,
        }))}
        previewHref={`/admin/products/${product.id}/preview`}
      />
    </>
  );
}
