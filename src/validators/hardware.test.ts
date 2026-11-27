import { describe, expect, it } from "vitest";
import { hardwareSchema } from "./hardware";

const base = {
  slug: "zebra-zd220",
  categoryId: null,
  brand: "Zebra",
  model: "ZD220",
  priceType: "ON_REQUEST" as const,
  price: null,
  currency: "usd",
  inStock: true,
  status: "DRAFT" as const,
  images: [],
  specs: [],
  ar: { name: "طابعة باركود", description: "" },
  en: { name: "", description: "" },
  productIds: [],
};
const issues = (input: unknown) => {
  const r = hardwareSchema.safeParse(input);
  return r.success
    ? []
    : r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`);
};

describe("hardwareSchema", () => {
  it("يقبل مسودة بلا صور", () => {
    expect(issues(base)).toEqual([]);
  });
  it("النشر يتطلب صورة واحدة على الأقل", () => {
    expect(issues({ ...base, status: "PUBLISHED" })).toContain(
      "images:imageRequired",
    );
    expect(
      issues({
        ...base,
        status: "PUBLISHED",
        images: [{ url: "/seed/x.png" }],
      }),
    ).toEqual([]);
  });
  it("السعر مطلوب لغير «عند الطلب»", () => {
    expect(issues({ ...base, priceType: "FIXED" })).toContain(
      "price:priceRequired",
    );
  });
  it("يرفض روابط صور غير آمنة ومفتاح مواصفة فارغاً", () => {
    expect(
      issues({ ...base, images: [{ url: "data:image/png;base64,x" }] }).join(),
    ).toContain("invalidUrl");
    expect(
      issues({ ...base, specs: [{ keyAr: "", keyEn: "", value: "x" }] }).join(),
    ).toContain("specs.0.keyAr");
  });
});
