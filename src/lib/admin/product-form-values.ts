import type { ProductFormValues } from "@/validators/product";
import type { ProductDetail } from "@/server/queries/products";

const emptyTr = {
  name: "",
  tagline: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
};

export function emptyProductForm(): ProductFormValues {
  return {
    slug: "",
    type: "SAAS",
    status: "DRAFT",
    categoryId: null,
    priceType: "ON_REQUEST",
    price: null,
    currency: "USD",
    featured: false,
    sortOrder: 0,
    version: "",
    platforms: "",
    coverImage: "",
    demoUrl: "",
    demoUsername: "",
    demoPassword: "",
    demoEmbeddable: true,
    videoProvider: null,
    videoId: "",
    trialDownloadUrl: "",
    ar: { ...emptyTr },
    en: { ...emptyTr },
    features: [],
    media: [],
    plans: [],
    faqs: [],
  };
}

function tr<T extends { locale: string }>(
  list: T[],
  locale: "ar" | "en",
): T | undefined {
  return list.find((item) => item.locale === locale);
}

/** يحوّل منتجاً من قاعدة البيانات إلى قيم نموذج الإدارة (Decimal → number، null → نص فارغ) */
export function productToFormValues(p: ProductDetail): ProductFormValues {
  const text = (locale: "ar" | "en") => {
    const t = tr(p.translations, locale);
    return {
      name: t?.name ?? "",
      tagline: t?.tagline ?? "",
      description: t?.description ?? "",
      seoTitle: t?.seoTitle ?? "",
      seoDescription: t?.seoDescription ?? "",
    };
  };
  return {
    id: p.id,
    slug: p.slug,
    type: p.type,
    status: p.status,
    categoryId: p.categoryId,
    priceType: p.priceType,
    price: p.price === null ? null : Number(p.price),
    currency: p.currency,
    featured: p.featured,
    sortOrder: p.sortOrder,
    version: p.version ?? "",
    platforms: p.platforms,
    coverImage: p.coverImage,
    demoUrl: p.demoUrl ?? "",
    demoUsername: p.demoUsername ?? "",
    demoPassword: p.demoPassword ?? "",
    demoEmbeddable: p.demoEmbeddable,
    videoProvider: p.videoProvider,
    videoId: p.videoId ?? "",
    trialDownloadUrl: p.trialDownloadUrl ?? "",
    ar: text("ar"),
    en: text("en"),
    features: p.features.map((f) => ({
      id: f.id,
      icon: f.icon,
      ar: {
        title: tr(f.translations, "ar")?.title ?? "",
        description: tr(f.translations, "ar")?.description ?? "",
      },
      en: {
        title: tr(f.translations, "en")?.title ?? "",
        description: tr(f.translations, "en")?.description ?? "",
      },
    })),
    media: p.media.map((m) => ({
      id: m.id,
      url: m.url,
      altAr: m.altAr,
      altEn: m.altEn,
    })),
    plans: p.plans.map((plan) => ({
      id: plan.id,
      price: Number(plan.price),
      billingPeriod: plan.billingPeriod,
      highlighted: plan.highlighted,
      ar: {
        name: tr(plan.translations, "ar")?.name ?? "",
        featuresText: (tr(plan.translations, "ar")?.features ?? []).join("\n"),
      },
      en: {
        name: tr(plan.translations, "en")?.name ?? "",
        featuresText: (tr(plan.translations, "en")?.features ?? []).join("\n"),
      },
    })),
    faqs: p.faqs.map((f) => ({
      id: f.id,
      ar: {
        question: tr(f.translations, "ar")?.question ?? "",
        answer: tr(f.translations, "ar")?.answer ?? "",
      },
      en: {
        question: tr(f.translations, "en")?.question ?? "",
        answer: tr(f.translations, "en")?.answer ?? "",
      },
    })),
  };
}
