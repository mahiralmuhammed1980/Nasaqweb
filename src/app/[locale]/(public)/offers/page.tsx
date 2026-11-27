import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { OfferCard } from "@/components/catalog/offer-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { listActiveOffers } from "@/server/queries/offers";

// ديناميكي: انتهاء العرض يُحسب من التاريخ وقت الطلب، فيختفي المنتهي دون أي تدخل.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Offers" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates(locale, "/offers"),
  };
}

export default async function OffersPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, offers] = await Promise.all([
    getTranslations("Offers"),
    listActiveOffers(),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">{t("description")}</p>

      {offers.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-muted-foreground">{t("none")}</p>
          <Button asChild className="mt-4">
            <Link href="/products">{t("browseProducts")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
