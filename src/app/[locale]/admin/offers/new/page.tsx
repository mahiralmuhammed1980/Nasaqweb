import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/admin/client-only";
import { OfferForm } from "@/components/admin/offer-form";
import { isLocale } from "@/i18n/routing";
import { emptyOfferForm } from "@/lib/admin/offer-hardware-form-values";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { listProductOptions } from "@/server/queries/admin-offers-hardware";

export default async function NewOfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/offers/new");
  const t = await getTranslations("AdminOffers");
  const products = (await listProductOptions()).map((p) => ({
    id: p.id,
    name: pickTranslation(p.translations, locale)?.name ?? p.slug,
  }));
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("new")}</h1>
      <ClientOnly>
        <OfferForm initial={emptyOfferForm()} products={products} />
      </ClientOnly>
    </>
  );
}
