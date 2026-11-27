import { createTranslator } from "next-intl";

/** مترجم لرسائل البريد من نفس ملفات messages (ar/en) حسب لغة الطلب. */
export async function emailTranslator(locale: "ar" | "en", namespace: string) {
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return createTranslator({ locale, messages, namespace });
}
