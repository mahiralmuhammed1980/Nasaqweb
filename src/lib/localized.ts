import type { Locale } from "@/i18n/routing";

type WithLocale = { locale: string };

/**
 * يختار ترجمة اللغة المطلوبة، وإن لم توجد يعيد العربية (الأساس) ولا يخفي العنصر.
 * وإن لم توجد العربية أيضاً يعيد أول ترجمة متاحة.
 */
export function pickTranslation<T extends WithLocale>(
  translations: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === "ar") ??
    translations[0]
  );
}
