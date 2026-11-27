import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";

type Props = {
  priceType: "FIXED" | "FROM" | "ON_REQUEST";
  price: number | null;
  currency: string;
  locale: Locale;
  className?: string;
};

export async function ProductPrice({
  priceType,
  price,
  currency,
  locale,
  className,
}: Props) {
  const t = await getTranslations({ locale, namespace: "Products" });
  if (priceType === "ON_REQUEST" || price === null) {
    return <span className={className}>{t("priceOnRequest")}</span>;
  }
  const formatted = formatMoney(price, currency, locale);
  return (
    <span className={className}>
      {priceType === "FROM" ? t("priceFrom", { price: formatted }) : formatted}
    </span>
  );
}
