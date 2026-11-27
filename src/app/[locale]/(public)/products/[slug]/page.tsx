import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/catalog/product-view";
import { isLocale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { absoluteAsset, absoluteUrl, localizedAlternates } from "@/lib/seo";
import {
  getPublishedProductBySlug,
  listPublishedProductSlugs,
  listRelatedProducts,
} from "@/server/queries/products";

type Props = { params: Promise<{ locale: string; slug: string }> };

// ISR: الصفحة ثابتة وتُعاد عند الحفظ من الإدارة (revalidatePath)، وكل 60 ثانية كحد أقصى لتتبّع العروض.
export const revalidate = 60;

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

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();
  const related = await listRelatedProducts(product);

  return <ProductView product={product} locale={locale} related={related} />;
}
