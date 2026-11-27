import type { Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/** رابط مطلق للمسار داخل لغة معينة (path يبدأ بـ / أو فارغ للرئيسية). */
export function absoluteUrl(locale: Locale, path = ""): string {
  return `${siteUrl()}/${locale}${path === "/" ? "" : path}`;
}

/** canonical + hreflang لكل صفحة */
export function localizedAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = {
    ...Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, path)])),
    "x-default": absoluteUrl("ar", path),
  };
  return {
    canonical: absoluteUrl(locale, path),
    languages,
  };
}

/** يحوّل رابط صورة (محلي أو مطلق) إلى رابط مطلق */
export function absoluteAsset(url: string): string {
  return url.startsWith("http") ? url : `${siteUrl()}${url}`;
}

/** يحقن JSON-LD بأمان: يمنع إغلاق وسم script من داخل القيم */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
