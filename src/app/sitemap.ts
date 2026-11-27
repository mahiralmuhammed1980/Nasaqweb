import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { absoluteUrl, localizedAlternates } from "@/lib/seo";
import { listPublishedProductSlugs } from "@/server/queries/products";

// ديناميكي: المنشور فقط، ويعكس النشر والإخفاء فوراً.
export const dynamic = "force-dynamic";

function entry(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: absoluteUrl(locale, path),
    lastModified,
    alternates: { languages: localizedAlternates(locale, path).languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listPublishedProductSlugs();
  return [
    ...entry(""),
    ...entry("/products"),
    ...products.flatMap((p) => entry(`/products/${p.slug}`, p.updatedAt)),
  ];
}
