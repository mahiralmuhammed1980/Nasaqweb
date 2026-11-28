import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturedTabs } from "@/components/catalog/featured-tabs";
import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { listFeaturedProducts } from "@/server/queries/products";
import { listActiveOffers } from "@/server/queries/offers";
import { getSiteSettings } from "@/server/queries/settings";
import { pickTranslation } from "@/lib/localized";
import { listFeaturedHardware } from "@/server/queries/hardware";
import { OfferStrip } from "@/components/catalog/offer-strip";
import { HardwareCard } from "@/components/catalog/hardware-card";

// ISR: تُعاد عند الحفظ من الإدارة (revalidatePath)، وكل 60 ثانية كحد أقصى لتتبّع بداية العروض وانتهائها.
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, featured, offers, hardware, settings] = await Promise.all([
    getTranslations("Home"),
    listFeaturedProducts(),
    listActiveOffers(),
    listFeaturedHardware(),
    getSiteSettings(),
  ]);

  const items = featured.map((product) => ({
    id: product.id,
    type: product.type,
    node: <ProductCard product={product} locale={locale} />,
  }));

  return (
    <>
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/products">
              {t("browse")}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">{t("contact")}</Link>
          </Button>
        </div>
      </section>

      <OfferStrip offers={offers} locale={locale} />

      <section
        aria-labelledby="featured-title"
        className="mx-auto max-w-6xl px-4 pb-20"
      >
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="featured-title" className="text-2xl font-bold">
            {t("featured")}
          </h2>
          <Link
            href="/products"
            className="text-primary text-sm font-medium hover:underline"
          >
            {t("viewAll")}
          </Link>
        </div>
        <FeaturedTabs items={items} />
      </section>

      {hardware.length > 0 && (
        <section
          aria-labelledby="hardware-title"
          className="mx-auto max-w-6xl px-4 pb-20"
        >
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="hardware-title" className="text-2xl font-bold">
              {t("hardware")}
            </h2>
            <Link
              href="/hardware"
              className="text-primary text-sm font-medium hover:underline"
            >
              {t("viewAllHardware")}
            </Link>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hardware.map((item) => (
              <li key={item.id}>
                <HardwareCard hardware={item} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {settings.whyUs.length > 0 && (
        <section aria-labelledby="why-title" className="bg-muted">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 id="why-title" className="text-2xl font-bold">
              {t("whyUs")}
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {settings.whyUs.map((point) => {
                const tr = pickTranslation(
                  [
                    { locale: "ar", ...point.ar },
                    ...(point.en.title ? [{ locale: "en", ...point.en }] : []),
                  ],
                  locale,
                );
                return (
                  <li key={point.ar.title}>
                    <h3 className="font-semibold">{tr?.title}</h3>
                    {tr?.description && (
                      <p className="text-muted-foreground mt-1 text-sm">
                        {tr.description}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
