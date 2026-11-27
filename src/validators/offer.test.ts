import { describe, expect, it } from "vitest";
import { offerSchema } from "./offer";

const tr = { title: "", description: "", terms: "" };
const base = {
  slug: "summer-sale",
  discountType: "PERCENT" as const,
  discountValue: 20,
  startsAt: "2026-06-01T00:00:00.000Z",
  endsAt: "2026-07-01T00:00:00.000Z",
  isActive: true,
  bannerImage: "",
  couponCode: "",
  ar: { ...tr, title: "عرض الصيف" },
  en: tr,
  productIds: [],
};
const issues = (input: unknown) => {
  const r = offerSchema.safeParse(input);
  return r.success
    ? []
    : r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`);
};

describe("offerSchema", () => {
  it("يقبل عرضاً صحيحاً ويطبّع الحقول الفارغة", () => {
    const r = offerSchema.parse(base);
    expect(r.bannerImage).toBeNull();
    expect(r.couponCode).toBeNull();
  });
  it("النسبة لا تتجاوز 100 والخصم موجب", () => {
    expect(issues({ ...base, discountValue: 120 })).toContain(
      "discountValue:percentMax",
    );
    expect(issues({ ...base, discountValue: 0 }).join()).toContain(
      "discountValue",
    );
    expect(
      issues({ ...base, discountType: "FIXED", discountValue: 500 }),
    ).toEqual([]);
  });
  it("النهاية بعد البداية", () => {
    expect(issues({ ...base, endsAt: base.startsAt })).toContain(
      "endsAt:endAfterStart",
    );
    expect(issues({ ...base, endsAt: "2026-05-01T00:00:00.000Z" })).toContain(
      "endsAt:endAfterStart",
    );
  });
  it("التاريخ يجب أن يكون ISO بمنطقة زمنية صريحة", () => {
    expect(issues({ ...base, startsAt: "2026-06-01T00:00" }).join()).toContain(
      "startsAt",
    );
  });
  it("العنوان العربي مطلوب، وصورة البانر آمنة", () => {
    expect(issues({ ...base, ar: tr })).toContain("ar.title:required");
    expect(issues({ ...base, bannerImage: "javascript:alert(1)" })).toContain(
      "bannerImage:invalidUrl",
    );
  });
});
