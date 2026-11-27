import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/routing";

/** بعد أي حفظ من لوحة التحكم: نبطل الصفحات المتأثرة بكل اللغات (ISR). */
export function revalidateCatalog(slugs: (string | null | undefined)[] = []) {
  for (const locale of locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/products`);
    for (const slug of new Set(slugs.filter((s): s is string => !!s))) {
      revalidatePath(`/${locale}/products/${slug}`);
    }
  }
  revalidatePath("/sitemap.xml");
}
