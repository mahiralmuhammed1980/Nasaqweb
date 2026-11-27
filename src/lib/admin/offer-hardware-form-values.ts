import { parseSpecs } from "@/lib/hardware-specs";
import type { HardwareFormValues } from "@/validators/hardware";
import type { OfferFormValues } from "@/validators/offer";
import type {
  getHardwareForAdmin,
  getOfferForAdmin,
} from "@/server/queries/admin-offers-hardware";

type OfferRow = NonNullable<Awaited<ReturnType<typeof getOfferForAdmin>>>;
type HardwareRow = NonNullable<Awaited<ReturnType<typeof getHardwareForAdmin>>>;

const tr = <T extends { locale: string }>(list: T[], locale: "ar" | "en") =>
  list.find((i) => i.locale === locale);

/** تواريخ العرض تُمرَّر ISO وتُحوَّل لتوقيت المتصفح داخل النموذج (انظر OfferForm). */
export function emptyOfferForm(): OfferFormValues {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
  return {
    slug: "",
    discountType: "PERCENT",
    discountValue: 10,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    isActive: true,
    bannerImage: "",
    couponCode: "",
    ar: { title: "", description: "", terms: "" },
    en: { title: "", description: "", terms: "" },
    productIds: [],
  };
}

export function offerToFormValues(o: OfferRow): OfferFormValues {
  const text = (locale: "ar" | "en") => {
    const t = tr(o.translations, locale);
    return {
      title: t?.title ?? "",
      description: t?.description ?? "",
      terms: t?.terms ?? "",
    };
  };
  return {
    id: o.id,
    slug: o.slug,
    discountType: o.discountType,
    discountValue: Number(o.discountValue),
    startsAt: o.startsAt.toISOString(),
    endsAt: o.endsAt.toISOString(),
    isActive: o.isActive,
    bannerImage: o.bannerImage ?? "",
    couponCode: o.couponCode ?? "",
    ar: text("ar"),
    en: text("en"),
    productIds: o.products.map((p) => p.productId),
  };
}

export function emptyHardwareForm(): HardwareFormValues {
  return {
    slug: "",
    categoryId: null,
    brand: "",
    model: "",
    priceType: "ON_REQUEST",
    price: null,
    currency: "USD",
    inStock: true,
    status: "DRAFT",
    images: [],
    specs: [],
    ar: { name: "", description: "" },
    en: { name: "", description: "" },
    productIds: [],
  };
}

export function hardwareToFormValues(h: HardwareRow): HardwareFormValues {
  const text = (locale: "ar" | "en") => {
    const t = tr(h.translations, locale);
    return { name: t?.name ?? "", description: t?.description ?? "" };
  };
  return {
    id: h.id,
    slug: h.slug,
    categoryId: h.categoryId,
    brand: h.brand,
    model: h.model,
    priceType: h.priceType,
    price: h.price === null ? null : Number(h.price),
    currency: h.currency,
    inStock: h.inStock,
    status: h.status,
    images: h.images.map((url) => ({ url })),
    specs: parseSpecs(h.specs),
    ar: text("ar"),
    en: text("en"),
    productIds: h.products.map((p) => p.productId),
  };
}
