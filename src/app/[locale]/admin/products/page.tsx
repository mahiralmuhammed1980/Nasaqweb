import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { deleteProduct } from "@/server/actions/admin/products";
import { listProductsForAdmin } from "@/server/queries/admin-products";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/products");
  const t = await getTranslations("AdminProducts");
  const products = await listProductsForAdmin();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/admin/products/new">{t("new")}</Link>
        </Button>
      </div>
      {products.length === 0 ? (
        <p className="text-muted-foreground mt-6">{t("empty")}</p>
      ) : (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 text-start">{t("fields.name")}</th>
              <th className="py-2 text-start">{t("fields.type")}</th>
              <th className="py-2 text-start">{t("fields.status")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-border border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {pickTranslation(p.translations, locale)?.name ?? p.slug}
                  </Link>
                </td>
                <td className="py-2">{t(`types.${p.type}`)}</td>
                <td className="py-2">{t(`status.${p.status}`)}</td>
                <td className="flex justify-end gap-2 py-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/products/${p.id}`}>{t("edit")}</Link>
                  </Button>
                  <DeleteButton
                    id={p.id}
                    action={deleteProduct}
                    confirmText={t("confirmDelete")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
