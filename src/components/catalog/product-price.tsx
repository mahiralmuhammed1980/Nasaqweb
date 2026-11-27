import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { effectivePriceOf } from "@/lib/product-pricing";

type Props = {
  product: Parameters<typeof effectivePriceOf>[0] & { currency: string };
  locale: Locale;
  className?: string;
  /** وقت الحساب (للاختبار)؛ الافتراضي الآن */
  now?: Date;
};

/** السعر مع الخصم: السعر الأصلي مشطوباً والسعر بعد أفضل عرض سارٍ. */
export async function ProductPrice({ product, locale, className, now }: Props) {
  const t = await getTranslations({ locale, namespace: "Products" });
  const price = effectivePriceOf(product, now);
  if (price.kind === "ON_REQUEST")
    return <span className={className}>{t("priceOnRequest")}</span>;

  const final = formatMoney(price.final, product.currency, locale);
  const prefix = (value: string) =>
    product.priceType === "FROM" ? t("priceFrom", { price: value }) : value;

  if (!price.offer) return <span className={className}>{prefix(final)}</span>;

  const original = formatMoney(price.original, product.currency, locale);
  return (
    <span className={className}>
      <span className="sr-only">{t("priceBefore", { price: original })}</span>
      <del
        aria-hidden
        className="text-muted-foreground me-2 text-sm font-normal"
      >
        {original}
      </del>
      {prefix(final)}
    </span>
  );
}
