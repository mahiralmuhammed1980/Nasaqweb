import { getTranslations } from "next-intl/server";
import { AppImage } from "@/components/ui/app-image";
import { Markdown } from "@/components/ui/markdown";
import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { toPriceOffer } from "@/lib/product-pricing";
import type { ActiveOffer } from "@/server/queries/offers";
import { Countdown } from "./countdown";
import { OfferBadge } from "./offer-badge";
import { ProductCard } from "./product-card";

export async function OfferCard({
  offer,
  locale,
}: {
  offer: ActiveOffer;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Offers" });
  const tr = pickTranslation(offer.translations, locale);
  if (!tr) return null;
  const currency = offer.products[0]?.product.currency ?? "USD";
  const priceOffer = toPriceOffer(offer);

  return (
    <article
      aria-labelledby={`offer-${offer.id}`}
      className="border-border space-y-4 rounded-xl border p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {offer.bannerImage && (
          <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-64">
            <AppImage
              src={offer.bannerImage}
              alt=""
              fill
              sizes="256px"
              className="object-cover"
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <OfferBadge
              offer={priceOffer}
              currency={currency}
              locale={locale}
            />
            <h2 id={`offer-${offer.id}`} className="text-xl font-bold">
              {tr.title}
            </h2>
          </div>
          {tr.description && (
            <p className="text-muted-foreground">{tr.description}</p>
          )}
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {t("endsLabel")}
            </span>
            <Countdown endsAt={offer.endsAt.toISOString()} />
          </p>
          {offer.couponCode && (
            <p className="text-sm">
              {t("coupon")}{" "}
              <code
                dir="ltr"
                className="bg-muted rounded px-2 py-1 font-semibold"
              >
                {offer.couponCode}
              </code>
            </p>
          )}
        </div>
      </div>

      {offer.products.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">{t("includedProducts")}</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offer.products.map(({ product }) => (
              <li key={product.id}>
                <ProductCard product={product} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {tr.terms && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">{t("terms")}</summary>
          <div className="text-muted-foreground mt-2">
            <Markdown>{tr.terms}</Markdown>
          </div>
        </details>
      )}
    </article>
  );
}
