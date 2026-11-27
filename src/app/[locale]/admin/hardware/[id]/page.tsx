import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HardwareForm } from "@/components/admin/hardware-form";
import { isLocale } from "@/i18n/routing";
import { hardwareToFormValues } from "@/lib/admin/offer-hardware-form-values";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import {
  getHardwareForAdmin,
  listProductOptions,
} from "@/server/queries/admin-offers-hardware";
import { listHardwareCategories } from "@/server/queries/hardware";

export default async function EditHardwarePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, `/admin/hardware/${id}`);
  const [t, item, options, categories] = await Promise.all([
    getTranslations("AdminHardware"),
    getHardwareForAdmin(id),
    listProductOptions(),
    listHardwareCategories(),
  ]);
  if (!item) notFound();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">
        {t("editTitle", {
          name: pickTranslation(item.translations, locale)?.name ?? item.slug,
        })}
      </h1>
      <HardwareForm
        initial={hardwareToFormValues(item)}
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
