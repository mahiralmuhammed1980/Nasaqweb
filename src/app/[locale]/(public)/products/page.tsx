import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductFilters } from "@/components/catalog/product-filters";
import { isLocale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { localizedAlternates } from "@/lib/seo";
import {
  listCategoriesWithTranslations,
  listProducts,
} from "@/server/queries/products";
import { parseProductFilters } from "@/validators/catalog-filters";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Products" });
  return {
    title: t("listTitle"),
    description: t("listDescription"),
    alternates: localizedAlternates(locale, "/products"),
  };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const filters = parseProductFilters(await searchParams);
  const t = await getTranslations("Products");

  const [products, categories] = await Promise.all([
    listProducts(filters),
    listCategoriesWithTranslations(),
  ]);
  const options = categories.map((c) => ({
    slug: c.slug,
    name: pickTranslation(c.translations, locale)?.name ?? c.slug,
  }));

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("listTitle")}</h1>
      <p className="text-muted-foreground mt-2">{t("listDescription")}</p>

      <div className="mt-6">
        <Suspense>
          <ProductFilters categories={options} />
        </Suspense>
      </div>

      <p className="text-muted-foreground mt-6 text-sm" aria-live="polite">
        {t("resultsCount", { count: products.length })}
      </p>

      {products.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-center">
          {t("noResults")}
        </p>
      ) : (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
