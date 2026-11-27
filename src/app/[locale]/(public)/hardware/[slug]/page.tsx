import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { AppImage } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { parseSpecs, specKey } from "@/lib/hardware-specs";
import { pickTranslation } from "@/lib/localized";
import {
  absoluteAsset,
  absoluteUrl,
  jsonLd,
  localizedAlternates,
} from "@/lib/seo";
import {
  getPublishedHardwareBySlug,
  listPublishedHardwareSlugs,
} from "@/server/queries/hardware";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await listPublishedHardwareSlugs()).map((h) => ({ slug: h.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const hardware = await getPublishedHardwareBySlug(slug);
  const tr = hardware && pickTranslation(hardware.translations, locale);
  if (!hardware || !tr) return {};
  const image = hardware.images[0]
    ? absoluteAsset(hardware.images[0])
    : undefined;
  return {
    title: `${tr.name} — ${hardware.brand}`,
    description:
      tr.description.slice(0, 160) || `${hardware.brand} ${hardware.model}`,
    alternates: localizedAlternates(locale, `/hardware/${slug}`),
    openGraph: {
      title: tr.name,
      type: "website",
      url: absoluteUrl(locale, `/hardware/${slug}`),
      images: image ? [{ url: image }] : [],
    },
  };
}

export default async function HardwarePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const hardware = await getPublishedHardwareBySlug(slug);
  if (!hardware) notFound();
  const tr = pickTranslation(hardware.translations, locale);
  if (!tr) notFound();
  const t = await getTranslations("Hardware");
  const specs = parseSpecs(hardware.specs);
  const priced = hardware.priceType !== "ON_REQUEST" && hardware.price !== null;
  const category = hardware.category
    ? pickTranslation(hardware.category.translations, locale)?.name
    : undefined;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tr.name,
    description: tr.description || undefined,
    brand: { "@type": "Brand", name: hardware.brand },
    model: hardware.model,
    image: hardware.images.map(absoluteAsset),
    url: absoluteUrl(locale, `/hardware/${hardware.slug}`),
    ...(priced
      ? {
          offers: {
            "@type": "Offer",
            price: Number(hardware.price).toString(),
            priceCurrency: hardware.currency,
            availability: hardware.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <article className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(ld) }}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {hardware.images[0] && (
            <div className="bg-muted relative aspect-video overflow-hidden rounded-xl">
              <AppImage
                src={hardware.images[0]}
                alt={tr.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          {hardware.images.length > 1 && (
            <ul className="grid grid-cols-4 gap-2">
              {hardware.images.slice(1).map((src) => (
                <li
                  key={src}
                  className="bg-muted relative aspect-video overflow-hidden rounded-lg"
                >
                  <AppImage
                    src={src}
                    alt=""
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <header className="space-y-3">
          {category && (
            <span className="bg-muted inline-block rounded-full px-3 py-1 text-xs font-medium">
              {category}
            </span>
          )}
          <h1 className="text-3xl font-bold">{tr.name}</h1>
          <p className="text-muted-foreground">
            {hardware.brand} · {hardware.model}
          </p>
          <p className="text-2xl font-bold">
            {priced
              ? formatMoney(Number(hardware.price), hardware.currency, locale)
              : t("priceOnRequest")}
          </p>
          <p className={hardware.inStock ? "text-green-700" : "text-red-700"}>
            {hardware.inStock ? t("inStock") : t("outOfStock")}
          </p>
          {/* نموذج الطلب في المرحلة 4؛ الرابط مؤقت إلى /contact */}
          <Link
            href={`/contact?hardware=${hardware.slug}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center rounded-md px-6 text-base font-medium"
          >
            {t("inquire")}
          </Link>
        </header>
      </div>

      {tr.description && (
        <section aria-labelledby="hw-desc">
          <h2 id="hw-desc" className="sr-only">
            {t("description")}
          </h2>
          <p className="leading-7 whitespace-pre-line">{tr.description}</p>
        </section>
      )}

      {specs.length > 0 && (
        <section aria-labelledby="hw-specs">
          <h2 id="hw-specs" className="text-2xl font-bold">
            {t("specs")}
          </h2>
          <table className="border-border mt-4 w-full overflow-hidden rounded-xl border text-sm">
            <tbody>
              {specs.map((spec) => (
                <tr
                  key={spec.keyAr}
                  className="border-border border-b last:border-b-0"
                >
                  <th
                    scope="row"
                    className="bg-muted w-1/3 p-3 text-start font-medium"
                  >
                    {specKey(spec, locale)}
                  </th>
                  <td className="p-3">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {hardware.products.length > 0 && (
        <section aria-labelledby="hw-apps">
          <h2 id="hw-apps" className="text-2xl font-bold">
            {t("compatibleApps")}
          </h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hardware.products.map(({ product }) => (
              <li key={product.id}>
                <ProductCard product={product} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
