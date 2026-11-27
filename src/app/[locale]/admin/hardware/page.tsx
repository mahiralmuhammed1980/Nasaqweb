import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { deleteHardware } from "@/server/actions/admin/hardware";
import { listHardwareForAdmin } from "@/server/queries/admin-offers-hardware";

export default async function AdminHardwarePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/hardware");
  const [t, tp, items] = await Promise.all([
    getTranslations("AdminHardware"),
    getTranslations("AdminProducts"),
    listHardwareForAdmin(),
  ]);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/admin/hardware/new">{t("new")}</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground mt-6">{t("empty")}</p>
      ) : (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 text-start">{tp("fields.name")}</th>
              <th className="py-2 text-start">{t("fields.brand")}</th>
              <th className="py-2 text-start">{tp("fields.status")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-border border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/hardware/${item.id}`}
                    className="font-medium hover:underline"
                  >
                    {pickTranslation(item.translations, locale)?.name ??
                      item.slug}
                  </Link>
                </td>
                <td className="py-2">
                  {item.brand} {item.model}
                </td>
                <td className="py-2">{tp(`status.${item.status}`)}</td>
                <td className="flex justify-end gap-2 py-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/hardware/${item.id}`}>
                      {tp("edit")}
                    </Link>
                  </Button>
                  <DeleteButton
                    id={item.id}
                    action={deleteHardware}
                    confirmText={tp("confirmDelete")}
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
