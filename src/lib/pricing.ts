export type PriceOffer = {
  id: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

export type PriceProduct = {
  priceType: "FIXED" | "FROM" | "ON_REQUEST";
  price: number | null;
  offers: readonly PriceOffer[];
};

export type EffectivePrice =
  | { kind: "ON_REQUEST" }
  | {
      kind: "PRICED";
      original: number;
      final: number;
      discount: number;
      /** العرض المطبَّق (الأفضل للزبون) أو null إن لم يوجد عرض ساري */
      offer: PriceOffer | null;
    };

/** العرض ساري إن كان مفعّلاً، وبدأ (شامل)، ولم ينتهِ (endsAt حصري). يُحسب وقت الطلب لا بمهام مجدولة. */
export function isOfferActive(offer: PriceOffer, now: Date): boolean {
  return (
    offer.isActive &&
    offer.startsAt.getTime() <= now.getTime() &&
    now.getTime() < offer.endsAt.getTime()
  );
}

/** قيمة الخصم بالسنت (أعداد صحيحة لتجنب أخطاء الفاصلة العائمة) */
function discountCents(offer: PriceOffer, priceCents: number): number {
  if (offer.discountType === "PERCENT") {
    const percent = Math.min(Math.max(offer.discountValue, 0), 100);
    return Math.round((priceCents * percent) / 100);
  }
  return Math.min(
    Math.max(Math.round(offer.discountValue * 100), 0),
    priceCents,
  );
}

/**
 * السعر الفعلي بعد أفضل عرض سارٍ للزبون.
 * - «السعر عند الطلب» (أو بدون سعر) لا يُخصم منه.
 * - عند التساوي في الخصم: الأقرب انتهاءً ثم المعرّف (نتيجة حتمية).
 */
export function getEffectivePrice(
  product: PriceProduct,
  now: Date = new Date(),
): EffectivePrice {
  if (product.priceType === "ON_REQUEST" || product.price === null)
    return { kind: "ON_REQUEST" };

  const originalCents = Math.round(product.price * 100);
  let best: { offer: PriceOffer; cents: number } | null = null;

  for (const offer of product.offers) {
    if (!isOfferActive(offer, now)) continue;
    const cents = discountCents(offer, originalCents);
    if (cents <= 0) continue;
    if (
      !best ||
      cents > best.cents ||
      (cents === best.cents &&
        (offer.endsAt.getTime() < best.offer.endsAt.getTime() ||
          (offer.endsAt.getTime() === best.offer.endsAt.getTime() &&
            offer.id < best.offer.id)))
    ) {
      best = { offer, cents };
    }
  }

  const discount = best?.cents ?? 0;
  return {
    kind: "PRICED",
    original: originalCents / 100,
    final: (originalCents - discount) / 100,
    discount: discount / 100,
    offer: best?.offer ?? null,
  };
}
