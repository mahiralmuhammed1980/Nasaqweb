import {
  getEffectivePrice,
  type EffectivePrice,
  type PriceOffer,
} from "./pricing";

type OfferRow = {
  id: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: { toString(): string };
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};

type PricedRow = {
  priceType: "FIXED" | "FROM" | "ON_REQUEST";
  price: { toString(): string } | null;
  offers: { offer: OfferRow }[];
};

export function toPriceOffer(offer: OfferRow): PriceOffer {
  return {
    id: offer.id,
    discountType: offer.discountType,
    discountValue: Number(offer.discountValue),
    startsAt: offer.startsAt,
    endsAt: offer.endsAt,
    isActive: offer.isActive,
  };
}

/** السعر الفعلي لمنتج من قاعدة البيانات (Decimal → number) وقت `now`. */
export function effectivePriceOf(
  product: PricedRow,
  now: Date = new Date(),
): EffectivePrice {
  return getEffectivePrice(
    {
      priceType: product.priceType,
      price: product.price === null ? null : Number(product.price),
      offers: product.offers.map((o) => toPriceOffer(o.offer)),
    },
    now,
  );
}
