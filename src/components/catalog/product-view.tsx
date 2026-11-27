import { getTranslations } from "next-intl/server";
import { LivePreview } from "@/components/catalog/live-preview";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductPrice } from "@/components/catalog/product-price";
import {
  FaqSection,
  FeaturesSection,
  PlansSection,
} from "@/components/catalog/product-sections";
import { ScreenshotGallery } from "@/components/catalog/screenshot-gallery";
import { VideoFacade } from "@/components/catalog/video-facade";
import { Markdown } from "@/components/ui/markdown";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { effectivePriceOf } from "@/lib/product-pricing";
import { Countdown } from "@/components/catalog/countdown";
import { HardwareCard } from "@/components/catalog/hardware-card";
import { OfferBadge } from "@/components/catalog/offer-badge";
import { absoluteAsset, absoluteUrl, jsonLd } from "@/lib/seo";
import type {
  ProductCard as ProductCardData,
  ProductDetail,
} from "@/server/queries/products";

function structuredData(
  product: ProductDetail,
  locale: Locale,
  name: string,
  description: string,
) {
  const offers =
    product.priceType !== "ON_REQUEST" && product.price !== null
      ? {
          "@type": "Offer",
          price: Number(product.price).toString(),
          priceCurrency: product.currency,
          availability: "https://schema.org/InStock",
        }
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: absoluteUrl(locale, `/products/${product.slug}`),
    image: absoluteAsset(product.coverImage),
    operatingSystem:
      product.platforms || (product.type === "SAAS" ? "Web" : undefined),
    applicationCategory: "BusinessApplication",
    softwareVersion: product.version ?? undefined,
    ...(offers ? { offers } : {}),
  };
}

/** عرض صفحة المنتج. يُستخدم في الصفحة العامة وفي معاينة المسودة بالإدارة. */
export async function ProductView({
  product,
  locale,
  related,
}: {
  product: ProductDetail;
  locale: Locale;
  related: ProductCardData[];
}) {
  const tr = pickTranslation(product.translations, locale);
  if (!tr) return null;
  const t = await getTranslations({ locale, namespace: "Products" });
  const tOffers = await getTranslations({ locale, namespace: "Offers" });
  const price = effectivePriceOf(product);
  const offerTr =
    price.kind === "PRICED" && price.offer
      ? product.offers.find((o) => o.offer.id === price.offer?.id)?.offer
          .translations
      : undefined;
  const offerTitle = offerTr
    ? pickTranslation(offerTr, locale)?.title
    : undefined;
  const hasLivePreview = product.type === "SAAS" && !!product.demoUrl;
  const shots = product.media.map((m) => ({
    url: m.url,
    alt: (locale === "ar" ? m.altAr : m.altEn) || m.altAr || m.altEn || tr.name,
  }));
  const orderHref = `/contact?product=${product.slug}`; // نموذج الطلب في المرحلة 4

  return (
    <article className="mx-auto max-w-5xl space-y-10 px-4 py-10 pb-28 md:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(structuredData(product, locale, tr.name, tr.tagline)),
        }}
      />

      <header className="space-y-3">
        <span className="bg-muted inline-block rounded-full px-3 py-1 text-xs font-medium">
          {t(`types.${product.type}`)}
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl">{tr.name}</h1>
        <p className="text-muted-foreground text-lg">{tr.tagline}</p>
        {(product.platforms || product.version) && (
          <p className="text-muted-foreground text-sm">
            {[
              product.platforms,
              product.version && t("version", { version: product.version }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <p className="text-2xl font-bold">
          <ProductPrice product={product} locale={locale} />
        </p>
        {price.kind === "PRICED" && price.offer && (
          <div className="bg-muted flex flex-wrap items-center gap-3 rounded-lg p-3">
            <OfferBadge
              offer={price.offer}
              currency={product.currency}
              locale={locale}
            />
            {offerTitle && (
              <span className="text-sm font-medium">{offerTitle}</span>
            )}
            <span className="text-muted-foreground text-sm">
              {tOffers("endsLabel")}
            </span>
            <Countdown endsAt={price.offer.endsAt.toISOString()} />
          </div>
        )}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={orderHref}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center rounded-md px-6 text-base font-medium"
          >
            {t("orderNow")}
          </Link>
        </div>
      </header>

      {hasLivePreview ? (
        <LivePreview
          demoUrl={product.demoUrl as string}
          embeddable={product.demoEmbeddable}
          username={product.demoUsername}
          password={product.demoPassword}
        />
      ) : (
        <section aria-labelledby="media-title" className="space-y-6">
          <h2 id="media-title" className="sr-only">
            {t("media")}
          </h2>
          {product.videoProvider && product.videoId && (
            <VideoFacade
              provider={product.videoProvider}
              videoId={product.videoId}
              title={tr.name}
              fallbackPoster={product.coverImage}
            />
          )}
          <ScreenshotGallery shots={shots} />
          {product.trialDownloadUrl && (
            <a
              href={product.trialDownloadUrl}
              rel="noopener noreferrer"
              className="border-border hover:bg-muted inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium"
            >
              {t("downloadTrial")}
            </a>
          )}
        </section>
      )}

      <FeaturesSection product={product} locale={locale} />
      <PlansSection product={product} locale={locale} />

      {tr.description && (
        <section aria-labelledby="description-title">
          <h2 id="description-title" className="sr-only">
            {t("description")}
          </h2>
          <Markdown>{tr.description}</Markdown>
        </section>
      )}

      {product.hardware.length > 0 && (
        <section aria-labelledby="hardware-title">
          <h2 id="hardware-title" className="text-2xl font-bold">
            {t("compatibleHardware")}
          </h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {product.hardware.map(({ hardware }) => (
              <li key={hardware.id}>
                <HardwareCard hardware={hardware} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <FaqSection product={product} locale={locale} />

      {related.length > 0 && (
        <section aria-labelledby="related-title">
          <h2 id="related-title" className="text-2xl font-bold">
            {t("related")}
          </h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* شريط سفلي ثابت على الجوال؛ زر واتساب يُضاف في المرحلة 4 مع الإعدادات */}
      <div className="border-border bg-background fixed inset-x-0 bottom-0 z-20 border-t p-3 md:hidden">
        <Link
          href={orderHref}
          className="bg-primary text-primary-foreground flex h-12 w-full items-center justify-center rounded-md text-base font-medium"
        >
          {t("orderNow")}
        </Link>
      </div>
    </article>
  );
}
