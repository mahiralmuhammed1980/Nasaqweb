import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
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
import { isLocale, locales, type Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import {
  absoluteAsset,
  absoluteUrl,
  jsonLd,
  localizedAlternates,
} from "@/lib/seo";
import {
  getPublishedProductBySlug,
  listPublishedProductSlugs,
  listRelatedProducts,
  type ProductDetail,
} from "@/server/queries/products";

type Props = { params: Promise<{ locale: string; slug: string }> };

// ISR: الصفحة ثابتة، وتُعاد عند الحفظ من لوحة التحكم عبر revalidatePath.
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const products = await listPublishedProductSlugs();
    return products.map((p) => ({ slug: p.slug }));
  } catch (error) {
    // لا قاعدة بيانات وقت البناء: تُولَّد الصفحات عند أول طلب (dynamicParams).
    console.warn(
      "generateStaticParams: products unavailable at build time",
      error instanceof Error ? error.name : "",
    );
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getPublishedProductBySlug(slug);
  if (!product) return {};
  const tr = pickTranslation(product.translations, locale);
  if (!tr) return {};
  const title = tr.seoTitle || tr.name;
  const description = tr.seoDescription || tr.tagline;
  const image = absoluteAsset(product.coverImage);
  return {
    title,
    description,
    alternates: localizedAlternates(locale, `/products/${slug}`),
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteUrl(locale, `/products/${slug}`),
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

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

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();
  const tr = pickTranslation(product.translations, locale);
  if (!tr) notFound();

  const [t, related] = await Promise.all([
    getTranslations("Products"),
    listRelatedProducts(product),
  ]);

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
          <ProductPrice
            priceType={product.priceType}
            price={product.price === null ? null : Number(product.price)}
            currency={product.currency}
            locale={locale}
          />
        </p>
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
