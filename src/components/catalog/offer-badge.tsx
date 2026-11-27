import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import type { PriceOffer } from "@/lib/pricing";

/** شارة الخصم: «-20%» أو «-$15» */
export async function OfferBadge({
  offer,
  currency,
  locale,
  className = "",
}: {
  offer: Pick<PriceOffer, "discountType" | "discountValue">;
  currency: string;
  locale: Locale;
  className?: string;
}) {
  const t = await getTranslations({ locale, namespace: "Offers" });
  const label =
    offer.discountType === "PERCENT"
      ? new Intl.NumberFormat(locale, {
          style: "percent",
          maximumFractionDigits: 2,
        }).format(offer.discountValue / 100)
      : formatMoney(offer.discountValue, currency, locale);
  return (
    <span
      className={`rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white ${className}`}
    >
      {t("badge", { discount: label })}
    </span>
  );
}
