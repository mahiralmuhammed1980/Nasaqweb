import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { toPriceOffer } from "@/lib/product-pricing";
import type { ActiveOffer } from "@/server/queries/offers";
import { Countdown } from "./countdown";
import { OfferBadge } from "./offer-badge";

/** شريط العروض السارية في الرئيسية؛ يختفي كلياً إن لم توجد عروض. */
export async function OfferStrip({
  offers,
  locale,
}: {
  offers: ActiveOffer[];
  locale: Locale;
}) {
  if (offers.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Offers" });
  return (
    <section
      aria-label={t("title")}
      className="bg-muted border-border mb-12 border-y"
    >
      <ul className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
        {offers.slice(0, 3).map((offer) => {
          const tr = pickTranslation(offer.translations, locale);
          if (!tr) return null;
          return (
            <li key={offer.id} className="flex flex-wrap items-center gap-3">
              <OfferBadge
                offer={toPriceOffer(offer)}
                currency={offer.products[0]?.product.currency ?? "USD"}
                locale={locale}
              />
              <span className="font-semibold">{tr.title}</span>
              <Countdown endsAt={offer.endsAt.toISOString()} />
              <Link
                href="/offers"
                className="text-primary ms-auto text-sm font-medium hover:underline"
              >
                {t("viewOffer")}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
