import { describe, expect, it } from "vitest";
import {
  getEffectivePrice,
  isOfferActive,
  type PriceOffer,
  type PriceProduct,
} from "./pricing";

const now = new Date("2026-06-15T12:00:00Z");
const day = 24 * 60 * 60 * 1000;

function offer(overrides: Partial<PriceOffer> = {}): PriceOffer {
  return {
    id: "o1",
    discountType: "PERCENT",
    discountValue: 20,
    startsAt: new Date(now.getTime() - day),
    endsAt: new Date(now.getTime() + day),
    isActive: true,
    ...overrides,
  };
}

function product(
  offers: PriceOffer[],
  overrides: Partial<PriceProduct> = {},
): PriceProduct {
  return { priceType: "FIXED", price: 100, offers, ...overrides };
}

describe("getEffectivePrice", () => {
  it("بدون عروض: السعر الأصلي", () => {
    expect(getEffectivePrice(product([]), now)).toEqual({
      kind: "PRICED",
      original: 100,
      final: 100,
      discount: 0,
      offer: null,
    });
  });

  it("عرض سارٍ بنسبة مئوية", () => {
    const o = offer();
    expect(getEffectivePrice(product([o]), now)).toEqual({
      kind: "PRICED",
      original: 100,
      final: 80,
      discount: 20,
      offer: o,
    });
  });

  it("عرض سارٍ بقيمة ثابتة", () => {
    const o = offer({ discountType: "FIXED", discountValue: 15 });
    const r = getEffectivePrice(product([o]), now);
    expect(r).toMatchObject({
      kind: "PRICED",
      final: 85,
      discount: 15,
      offer: o,
    });
  });

  it("عرض قادم (لم يبدأ) لا يُطبَّق", () => {
    const o = offer({
      startsAt: new Date(now.getTime() + day),
      endsAt: new Date(now.getTime() + 2 * day),
    });
    expect(getEffectivePrice(product([o]), now)).toMatchObject({
      final: 100,
      offer: null,
    });
  });

  it("عرض منتهٍ لا يُطبَّق", () => {
    const o = offer({
      startsAt: new Date(now.getTime() - 2 * day),
      endsAt: new Date(now.getTime() - day),
    });
    expect(getEffectivePrice(product([o]), now)).toMatchObject({
      final: 100,
      offer: null,
    });
  });

  it("عرض معطَّل (isActive=false) لا يُطبَّق ولو كان ضمن المدة", () => {
    expect(
      getEffectivePrice(product([offer({ isActive: false })]), now),
    ).toMatchObject({ final: 100, offer: null });
  });

  it("عرضان متداخلان: يُطبَّق الأفضل للزبون", () => {
    const percent = offer({
      id: "pct",
      discountType: "PERCENT",
      discountValue: 10,
    }); // 10
    const fixed = offer({
      id: "fix",
      discountType: "FIXED",
      discountValue: 30,
    }); // 30
    const r = getEffectivePrice(product([percent, fixed]), now);
    expect(r).toMatchObject({ final: 70, discount: 30 });
    expect(r.kind === "PRICED" && r.offer?.id).toBe("fix");
    // الترتيب لا يغيّر النتيجة
    const reversed = getEffectivePrice(product([fixed, percent]), now);
    expect(reversed.kind === "PRICED" && reversed.offer?.id).toBe("fix");
  });

  it("عرضان متداخلان: عرض منتهٍ لا يزاحم عرضاً ساري أقل خصماً", () => {
    const expired = offer({
      id: "old",
      discountValue: 90,
      endsAt: new Date(now.getTime() - 1),
    });
    const live = offer({ id: "live", discountValue: 10 });
    const r = getEffectivePrice(product([expired, live]), now);
    expect(r).toMatchObject({ final: 90 });
    expect(r.kind === "PRICED" && r.offer?.id).toBe("live");
  });

  it("سعر عند الطلب: لا خصم ولا سعر", () => {
    expect(
      getEffectivePrice(
        product([offer()], { priceType: "ON_REQUEST", price: null }),
        now,
      ),
    ).toEqual({ kind: "ON_REQUEST" });
    // حتى لو بقي سعر قديم في الحقل
    expect(
      getEffectivePrice(
        product([offer()], { priceType: "ON_REQUEST", price: 50 }),
        now,
      ),
    ).toEqual({ kind: "ON_REQUEST" });
  });

  it("حد البداية شامل وحد النهاية حصري", () => {
    const o = offer({ startsAt: now, endsAt: new Date(now.getTime() + 1000) });
    expect(isOfferActive(o, now)).toBe(true);
    expect(isOfferActive(o, new Date(now.getTime() - 1))).toBe(false);
    expect(isOfferActive(o, new Date(o.endsAt.getTime() - 1))).toBe(true);
    expect(isOfferActive(o, o.endsAt)).toBe(false);
  });

  it("الخصم الثابت الأكبر من السعر لا يجعله سالباً", () => {
    const r = getEffectivePrice(
      product([offer({ discountType: "FIXED", discountValue: 500 })]),
      now,
    );
    expect(r).toMatchObject({ final: 0, discount: 100 });
  });

  it("النسبة فوق 100 تُقيَّد بـ 100", () => {
    expect(
      getEffectivePrice(product([offer({ discountValue: 150 })]), now),
    ).toMatchObject({ final: 0 });
  });

  it("دقة الكسور العشرية بالسنت", () => {
    const r = getEffectivePrice(
      product([offer({ discountValue: 15 })], { price: 19.99 }),
      now,
    );
    expect(r).toMatchObject({ original: 19.99, discount: 3, final: 16.99 });
    expect(
      getEffectivePrice(
        product([offer({ discountValue: 33 })], { price: 0.1 }),
        now,
      ),
    ).toMatchObject({ final: 0.07 });
  });

  it("سعر «ابتداءً من» يُخصم مثل الثابت", () => {
    expect(
      getEffectivePrice(
        product([offer()], { priceType: "FROM", price: 29 }),
        now,
      ),
    ).toMatchObject({ final: 23.2 });
  });

  it("خصم صفر لا يُعدّ عرضاً مطبَّقاً", () => {
    expect(
      getEffectivePrice(product([offer({ discountValue: 0 })]), now),
    ).toMatchObject({ discount: 0, offer: null });
  });

  it("تعادل الخصم: الأقرب انتهاءً ثم المعرّف (حتمي)", () => {
    const a = offer({ id: "a", endsAt: new Date(now.getTime() + 2 * day) });
    const b = offer({ id: "b", endsAt: new Date(now.getTime() + day) });
    const r = getEffectivePrice(product([a, b]), now);
    expect(r.kind === "PRICED" && r.offer?.id).toBe("b");
    const c = offer({ id: "c" });
    const d = offer({ id: "d" });
    expect(
      (getEffectivePrice(product([d, c]), now) as { offer: PriceOffer }).offer
        .id,
    ).toBe("c");
  });

  it("يعتمد على وقت الاستدعاء: نفس العرض يختفي بعد انتهائه دون أي تدخل", () => {
    const o = offer({ endsAt: new Date("2026-06-15T12:00:10Z") });
    expect(
      getEffectivePrice(product([o]), new Date("2026-06-15T12:00:09Z")),
    ).toMatchObject({ final: 80 });
    expect(
      getEffectivePrice(product([o]), new Date("2026-06-15T12:00:10Z")),
    ).toMatchObject({ final: 100, offer: null });
  });
});
