"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const target: Locale = locale === "ar" ? "en" : "ar";
  const href = search ? `${pathname}?${search}` : pathname;

  return (
    <Link
      href={href}
      locale={target}
      hrefLang={target}
      lang={target}
      aria-label={t("switchTo", { language: t(target) })}
      className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
    >
      {t(target)}
    </Link>
  );
}
