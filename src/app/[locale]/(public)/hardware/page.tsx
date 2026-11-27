import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HardwareCard } from "@/components/catalog/hardware-card";
import { HardwareFilters } from "@/components/catalog/hardware-filters";
import { isLocale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { localizedAlternates } from "@/lib/seo";
import {
  listHardware,
  listHardwareCategories,
} from "@/server/queries/hardware";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Hardware" });
  return {
    title: t("listTitle"),
    description: t("listDescription"),
    alternates: localizedAlternates(locale, "/hardware"),
  };
}

export default async function HardwarePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const raw = (await searchParams).category;
  const category =
    (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 80) || undefined;
  const t = await getTranslations("Hardware");
  const [items, categories] = await Promise.all([
    listHardware(category),
    listHardwareCategories(),
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
          <HardwareFilters categories={options} />
        </Suspense>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-center">{t("none")}</p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <HardwareCard hardware={item} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
