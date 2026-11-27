/**
 * يقبل مساراً نسبياً داخل الموقع فقط (يمنع open redirect).
 * يعيد `fallback` لأي قيمة أخرى.
 */
export function sanitizeCallbackUrl(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

/** يستخرج اللغة من بادئة المسار (/ar/... أو /en/...). */
export function localeFromPath(
  path: string,
  fallback: "ar" | "en" = "ar",
): "ar" | "en" {
  const match = /^\/(ar|en)(\/|\?|$)/.exec(path);
  return (match?.[1] as "ar" | "en" | undefined) ?? fallback;
}
