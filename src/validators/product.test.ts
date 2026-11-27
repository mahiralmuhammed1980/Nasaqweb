import { describe, expect, it } from "vitest";
import { splitLines } from "@/lib/text";
import { categorySchema, productSchema } from "./product";

const tr = {
  name: "",
  tagline: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
};
const base = {
  slug: "my-app",
  type: "SAAS" as const,
  status: "DRAFT" as const,
  categoryId: null,
  priceType: "ON_REQUEST" as const,
  price: null,
  currency: "usd",
  featured: false,
  sortOrder: 0,
  version: "",
  platforms: "Web",
  coverImage: "/seed/saas-cover.png",
  demoUrl: "",
  demoUsername: "",
  demoPassword: "",
  demoEmbeddable: true,
  videoProvider: null,
  videoId: "",
  trialDownloadUrl: "",
  ar: { ...tr, name: "تطبيق", tagline: "سطر" },
  en: tr,
  features: [],
  media: [],
  plans: [],
  faqs: [],
};

const issues = (input: unknown) => {
  const r = productSchema.safeParse(input);
  return r.success
    ? []
    : r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`);
};

describe("productSchema", () => {
  it("يقبل منتجاً صحيحاً ويطبّع القيم", () => {
    const r = productSchema.parse(base);
    expect(r.currency).toBe("USD");
    expect(r.demoUrl).toBeNull();
    expect(r.version).toBeNull();
  });
  it("يشترط الاسم والسطر التعريفي بالعربية", () => {
    expect(issues({ ...base, ar: { ...tr } })).toEqual(
      expect.arrayContaining(["ar.name:required", "ar.tagline:required"]),
    );
  });
  it("الإنجليزية اختيارية، لكن إن بدأت فالاسم مطلوب", () => {
    expect(issues({ ...base, en: { ...tr, description: "x" } })).toContain(
      "en.name:required",
    );
  });
  it("السعر مطلوب لغير «عند الطلب»", () => {
    expect(issues({ ...base, priceType: "FIXED" })).toContain(
      "price:priceRequired",
    );
    expect(issues({ ...base, priceType: "FIXED", price: 10 })).toEqual([]);
  });
  it("يرفض slug غير صالح", () => {
    expect(issues({ ...base, slug: "Bad Slug!" }).join()).toContain("slug");
    expect(issues({ ...base, slug: "-bad-" }).join()).toContain("slug");
  });
  it("يرفض روابط غير https للتجربة والتحميل", () => {
    expect(issues({ ...base, demoUrl: "http://x.com" })).toContain(
      "demoUrl:invalidUrl",
    );
    expect(
      issues({ ...base, trialDownloadUrl: "javascript:alert(1)" }),
    ).toContain("trialDownloadUrl:invalidUrl");
    expect(issues({ ...base, demoUrl: "https://demo.example.com" })).toEqual(
      [],
    );
  });
  it("يرفض صورة بغير مسار محلي أو https", () => {
    expect(
      issues({ ...base, coverImage: "data:image/png;base64,xx" }),
    ).toContain("coverImage:invalidUrl");
    expect(issues({ ...base, coverImage: "//evil.com/x.png" })).toContain(
      "coverImage:invalidUrl",
    );
  });
  it("الفيديو: المزوّد والمعرّف معاً وبصيغة صحيحة", () => {
    expect(issues({ ...base, videoProvider: "YOUTUBE" })).toContain(
      "videoId:videoBoth",
    );
    expect(
      issues({ ...base, videoProvider: "YOUTUBE", videoId: "bad id" }),
    ).toContain("videoId:videoInvalid");
    expect(
      issues({ ...base, videoProvider: "YOUTUBE", videoId: "M7lc1UVf-VE" }),
    ).toEqual([]);
  });
  it("يرفض أيقونة خارج القائمة", () => {
    expect(
      issues({
        ...base,
        features: [
          {
            icon: "Evil",
            ar: { title: "x", description: "" },
            en: { title: "", description: "" },
          },
        ],
      }).join(),
    ).toContain("features.0.icon");
  });
});

describe("categorySchema", () => {
  it("يشترط الاسم العربي وslug صالحاً", () => {
    expect(
      categorySchema.safeParse({
        slug: "pos",
        sortOrder: 1,
        ar: { name: "نقاط" },
        en: { name: "" },
      }).success,
    ).toBe(true);
    expect(
      categorySchema.safeParse({
        slug: "pos",
        sortOrder: 1,
        ar: { name: "" },
        en: { name: "" },
      }).success,
    ).toBe(false);
  });
});

describe("splitLines", () => {
  it("يقسم ويُهمل الفارغ", () => {
    expect(splitLines(" a \n\n b\n")).toEqual(["a", "b"]);
  });
});
