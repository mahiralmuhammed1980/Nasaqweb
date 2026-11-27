import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/admin/client-only";
import { OfferForm } from "@/components/admin/offer-form";
import { isLocale } from "@/i18n/routing";
import { offerToFormValues } from "@/lib/admin/offer-hardware-form-values";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import {
  getOfferForAdmin,
  listProductOptions,
} from "@/server/queries/admin-offers-hardware";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, `/admin/offers/${id}`);
  const [t, offer, options] = await Promise.all([
    getTranslations("AdminOffers"),
    getOfferForAdmin(id),
    listProductOptions(),
  ]);
  if (!offer) notFound();
  const products = options.map((p) => ({
    id: p.id,
    name: pickTranslation(p.translations, locale)?.name ?? p.slug,
  }));
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">
        {t("editTitle", {
          name:
            pickTranslation(offer.translations, locale)?.title ?? offer.slug,
        })}
      </h1>
      <ClientOnly>
        <OfferForm initial={offerToFormValues(offer)} products={products} />
      </ClientOnly>
    </>
  );
}
