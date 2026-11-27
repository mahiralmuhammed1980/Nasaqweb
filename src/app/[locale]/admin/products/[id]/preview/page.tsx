import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/catalog/product-view";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import {
  getProductByIdForPreview,
  listRelatedProducts,
} from "@/server/queries/products";

/** معاينة قبل النشر: تعرض أي حالة (مسودة/مؤرشف) وللمدير فقط. */
export default async function ProductPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, `/admin/products/${id}/preview`);
  const [t, product] = await Promise.all([
    getTranslations("AdminProducts"),
    getProductByIdForPreview(id),
  ]);
  if (!product) notFound();
  const related = await listRelatedProducts(product);
  return (
    <>
      <div
        className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-900"
        role="note"
      >
        {t("previewBanner", { status: t(`status.${product.status}`) })}{" "}
        <Link
          href={`/admin/products/${product.id}`}
          className="font-medium underline"
        >
          {t("backToEdit")}
        </Link>
      </div>
      <ProductView product={product} locale={locale} related={related} />
    </>
  );
}
