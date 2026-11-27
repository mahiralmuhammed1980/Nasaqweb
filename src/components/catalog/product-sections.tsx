import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { OrderLauncher } from "@/components/forms/order-launcher";
import type { Locale } from "@/i18n/routing";
import { featureIcon } from "@/lib/feature-icons";
import { formatMoney } from "@/lib/format";
import { pickTranslation } from "@/lib/localized";
import type { ProductDetail } from "@/server/queries/products";

export async function FeaturesSection({
  product,
  locale,
}: {
  product: ProductDetail;
  locale: Locale;
}) {
  if (product.features.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Products" });
  return (
    <section aria-labelledby="features-title">
      <h2 id="features-title" className="text-2xl font-bold">
        {t("features")}
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {product.features.map((feature) => {
          const tr = pickTranslation(feature.translations, locale);
          if (!tr) return null;
          const Icon = featureIcon(feature.icon);
          return (
            <li
              key={feature.id}
              className="border-border flex gap-3 rounded-xl border p-4"
            >
              <Icon className="text-primary mt-1 size-6 shrink-0" aria-hidden />
              <div>
                <h3 className="font-semibold">{tr.title}</h3>
                {tr.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {tr.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function PlansSection({
  product,
  locale,
  productName,
  options,
  whatsappNumber,
}: {
  product: ProductDetail;
  locale: Locale;
  productName: string;
  options: { id: string; label: string }[];
  whatsappNumber: string | null;
}) {
  if (product.plans.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Products" });
  return (
    <section id="plans" aria-labelledby="plans-title">
      <h2 id="plans-title" className="text-2xl font-bold">
        {t("plans")}
      </h2>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {product.plans.map((plan) => {
          const tr = pickTranslation(plan.translations, locale);
          if (!tr) return null;
          return (
            <li
              key={plan.id}
              className={`flex flex-col rounded-xl border p-5 ${plan.highlighted ? "border-primary ring-primary ring-2" : "border-border"}`}
            >
              {plan.highlighted && (
                <span className="text-primary mb-2 text-xs font-semibold">
                  {t("recommended")}
                </span>
              )}
              <h3 className="text-lg font-semibold">{tr.name}</h3>
              <p className="mt-2 text-2xl font-bold">
                {formatMoney(Number(plan.price), product.currency, locale)}
                <span className="text-muted-foreground ms-1 text-sm font-normal">
                  {t(`billing.${plan.billingPeriod}`)}
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {tr.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <OrderLauncher
                target={{
                  kind: "product",
                  slug: product.slug,
                  name: productName,
                }}
                plans={options}
                planId={plan.id}
                whatsappNumber={whatsappNumber}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
              >
                {t("orderPlan")}
              </OrderLauncher>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export async function FaqSection({
  product,
  locale,
}: {
  product: ProductDetail;
  locale: Locale;
}) {
  if (product.faqs.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Products" });
  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-2xl font-bold">
        {t("faq")}
      </h2>
      <div className="divide-border border-border mt-4 divide-y rounded-xl border">
        {product.faqs.map((faq) => {
          const tr = pickTranslation(faq.translations, locale);
          if (!tr) return null;
          return (
            <details key={faq.id} className="group p-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                {tr.question}
              </summary>
              <p className="text-muted-foreground mt-2">{tr.answer}</p>
            </details>
          );
        })}
      </div>
    </section>
  );
}
