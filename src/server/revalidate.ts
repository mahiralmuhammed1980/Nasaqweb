import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/routing";

type Slugs = (string | null | undefined)[];

const uniq = (slugs: Slugs) => [
  ...new Set(slugs.filter((s): s is string => !!s)),
];

/** بعد أي حفظ من لوحة التحكم: نبطل الصفحات المتأثرة بكل اللغات (ISR). */
export function revalidateCatalog(
  productSlugs: Slugs = [],
  hardwareSlugs: Slugs = [],
) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/products`);
    revalidatePath(`/${locale}/offers`);
    revalidatePath(`/${locale}/hardware`);
    for (const slug of uniq(productSlugs))
      revalidatePath(`/${locale}/products/${slug}`);
    for (const slug of uniq(hardwareSlugs))
      revalidatePath(`/${locale}/hardware/${slug}`);
  }
  revalidatePath("/sitemap.xml");
}
