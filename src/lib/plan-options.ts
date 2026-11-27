import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatMoney } from "./format";
import { pickTranslation } from "./localized";

type PlanLike = {
  id: string;
  price: { toString(): string };
  billingPeriod: "ONE_TIME" | "MONTHLY" | "YEARLY";
  translations: { locale: string; name: string }[];
};

/** خيارات قائمة الخطط في نموذج الطلب: «احترافي — $499 مرة واحدة» */
export async function planOptions(
  plans: readonly PlanLike[],
  currency: string,
  locale: Locale,
) {
  const t = await getTranslations({ locale, namespace: "Products.billing" });
  return plans.map((plan) => ({
    id: plan.id,
    label: `${pickTranslation(plan.translations, locale)?.name ?? ""} — ${formatMoney(Number(plan.price), currency, locale)} ${t(plan.billingPeriod)}`,
  }));
}
