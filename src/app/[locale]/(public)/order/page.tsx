import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/forms/order-form";
import { isLocale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import { planOptions } from "@/lib/plan-options";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/server/queries/settings";

export const metadata: Metadata = { robots: { index: false } };

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.slice(0, 80);

/** صفحة الطلب الكاملة (الجوال، وبلا JavaScript). على سطح المكتب يفتح النموذج في نافذة منبثقة. */
export default async function OrderPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const productSlug = first(query.product);
  const hardwareSlug = first(query.hardware);
  const planId = first(query.plan);
  const [t, { contact }] = await Promise.all([
    getTranslations("Order"),
    getSiteSettings(),
  ]);

  let content: React.ReactNode = null;
  if (productSlug) {
    const product = await db.product.findFirst({
      where: { slug: productSlug, status: "PUBLISHED" },
      include: {
        translations: true,
        plans: {
          orderBy: { sortOrder: "asc" },
          include: { translations: true },
        },
      },
    });
    if (!product) notFound();
    const name =
      pickTranslation(product.translations, locale)?.name ?? product.slug;
    content = (
      <OrderForm
        target={{ kind: "product", slug: product.slug, name }}
        plans={await planOptions(product.plans, product.currency, locale)}
        defaultPlanId={
          product.plans.some((p) => p.id === planId) ? planId : undefined
        }
        whatsappNumber={contact.whatsapp}
      />
    );
  } else if (hardwareSlug) {
    const hardware = await db.hardware.findFirst({
      where: { slug: hardwareSlug, status: "PUBLISHED" },
      include: { translations: true },
    });
    if (!hardware) notFound();
    const name =
      pickTranslation(hardware.translations, locale)?.name ?? hardware.slug;
    content = (
      <OrderForm
        target={{ kind: "hardware", slug: hardware.slug, name }}
        whatsappNumber={contact.whatsapp}
      />
    );
  } else {
    notFound();
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      {content}
    </section>
  );
}
