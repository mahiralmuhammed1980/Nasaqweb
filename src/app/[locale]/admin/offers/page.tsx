import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { offerState } from "@/lib/datetime";
import { pickTranslation } from "@/lib/localized";
import { deleteOffer } from "@/server/actions/admin/offers";
import { listOffersForAdmin } from "@/server/queries/admin-offers-hardware";

export default async function AdminOffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/offers");
  const t = await getTranslations("AdminOffers");
  const offers = await listOffersForAdmin();
  const now = new Date();
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/admin/offers/new">{t("new")}</Link>
        </Button>
      </div>
      {offers.length === 0 ? (
        <p className="text-muted-foreground mt-6">{t("empty")}</p>
      ) : (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 text-start">{t("fields.title")}</th>
              <th className="py-2 text-start">{t("state")}</th>
              <th className="py-2 text-start">{t("fields.endsAt")} (UTC)</th>
              <th className="py-2 text-start">{t("productsCount")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-border border-b">
                <td className="py-2">
                  <Link
                    href={`/admin/offers/${offer.id}`}
                    className="font-medium hover:underline"
                  >
                    {pickTranslation(offer.translations, locale)?.title ??
                      offer.slug}
                  </Link>
                </td>
                <td className="py-2">
                  {t(`states.${offerState(offer, now)}`)}
                </td>
                <td className="py-2" dir="ltr">
                  {date.format(offer.endsAt)}
                </td>
                <td className="py-2">{offer._count.products}</td>
                <td className="flex justify-end gap-2 py-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/offers/${offer.id}`}>{t("edit")}</Link>
                  </Button>
                  <DeleteButton
                    id={offer.id}
                    action={deleteOffer}
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
