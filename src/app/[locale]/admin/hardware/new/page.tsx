import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HardwareForm } from "@/components/admin/hardware-form";
import { isLocale } from "@/i18n/routing";
import { emptyHardwareForm } from "@/lib/admin/offer-hardware-form-values";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { listProductOptions } from "@/server/queries/admin-offers-hardware";
import { listHardwareCategories } from "@/server/queries/hardware";

export default async function NewHardwarePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/hardware/new");
  const [t, options, categories] = await Promise.all([
    getTranslations("AdminHardware"),
    listProductOptions(),
    listHardwareCategories(),
  ]);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t("new")}</h1>
      <HardwareForm
        initial={emptyHardwareForm()}
        categories={categories.map((c) => ({
          id: c.id,
          name: pickTranslation(c.translations, locale)?.name ?? c.slug,
        }))}
        products={options.map((p) => ({
          id: p.id,
          name: pickTranslation(p.translations, locale)?.name ?? p.slug,
        }))}
      />
    </>
  );
}
