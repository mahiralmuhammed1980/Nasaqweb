import { describe, expect, it } from "vitest";
import { contactInputSchema, orderInputSchema } from "./order";

const base = {
  productSlug: "restaurant-saas",
  name: "أحمد",
  phone: "+962 79 123 4567",
  phoneHasWhatsapp: true,
  email: "",
  company: "",
  city: "",
  country: "",
  preferredChannel: "WHATSAPP" as const,
  message: "",
  marketingConsent: false,
  locale: "ar" as const,
};
const issues = (
  schema: typeof orderInputSchema | typeof contactInputSchema,
  input: unknown,
) => {
  const r = schema.safeParse(input);
  return r.success
    ? []
    : r.error.issues.map((i) => `${i.path.join(".")}:${i.message}`);
};

describe("orderInputSchema", () => {
  it("يقبل طلباً صحيحاً ويطبّع الهاتف والحقول الفارغة", () => {
    const r = orderInputSchema.parse(base);
    expect(r.phone).toBe("+962791234567");
    expect(r.email).toBeNull();
    expect(r.company).toBeNull();
    expect(r.referrer).toBeNull();
  });
  it("يشترط الهاتف بصيغة دولية", () => {
    expect(
      issues(orderInputSchema, { ...base, phone: "0791234567" }),
    ).toContain("phone:invalidPhone");
  });
  it("منتج أو جهاز واحد بالضبط", () => {
    expect(
      issues(orderInputSchema, { ...base, productSlug: undefined }),
    ).toContain("productSlug:targetRequired");
    expect(
      issues(orderInputSchema, { ...base, hardwareSlug: "zebra" }),
    ).toContain("productSlug:targetRequired");
    expect(
      issues(orderInputSchema, {
        ...base,
        productSlug: undefined,
        hardwareSlug: "zebra",
      }),
    ).toEqual([]);
  });
  it("الخطة تتطلب منتجاً", () => {
    expect(
      issues(orderInputSchema, {
        ...base,
        productSlug: undefined,
        hardwareSlug: "z",
        planId: "p",
      }),
    ).toContain("planId:planNeedsProduct");
  });
  it("البريد إلزامي فقط إن اختير قناة بريد", () => {
    expect(
      issues(orderInputSchema, { ...base, preferredChannel: "EMAIL" }),
    ).toContain("email:emailRequiredForChannel");
    expect(
      issues(orderInputSchema, {
        ...base,
        preferredChannel: "EMAIL",
        email: "A@B.com",
      }),
    ).toEqual([]);
    expect(
      issues(orderInputSchema, { ...base, email: "not-an-email" }),
    ).toContain("email:invalidEmail");
  });
  it("الموافقة التسويقية تتطلب قناة (بريد أو واتساب)", () => {
    expect(
      issues(orderInputSchema, {
        ...base,
        phoneHasWhatsapp: false,
        marketingConsent: true,
      }),
    ).toContain("marketingConsent:consentNeedsChannel");
    expect(
      issues(orderInputSchema, { ...base, marketingConsent: true }),
    ).toEqual([]);
  });
  it("الاسم القصير والطويل", () => {
    expect(issues(orderInputSchema, { ...base, name: "أ" })).toContain(
      "name:required",
    );
    expect(
      issues(orderInputSchema, { ...base, message: "x".repeat(2001) }).join(),
    ).toContain("message");
  });
  it("المرجع مسار داخلي فقط", () => {
    expect(
      orderInputSchema.parse({ ...base, referrer: "https://evil.com" })
        .referrer,
    ).toBeNull();
    expect(
      orderInputSchema.parse({ ...base, referrer: "//evil.com" }).referrer,
    ).toBeNull();
    expect(
      orderInputSchema.parse({ ...base, referrer: "/ar/products/x" }).referrer,
    ).toBe("/ar/products/x");
  });
});

describe("contactInputSchema", () => {
  const contact = {
    name: "سارة",
    email: "s@x.com",
    phone: "",
    subject: "استفسار",
    message: "أريد معرفة المزيد",
    marketingConsent: false,
    locale: "en" as const,
  };
  it("يقبل رسالة صحيحة", () => {
    expect(issues(contactInputSchema, contact)).toEqual([]);
    expect(contactInputSchema.parse(contact).phone).toBeNull();
  });
  it("بريد أو هاتف على الأقل", () => {
    expect(issues(contactInputSchema, { ...contact, email: "" })).toContain(
      "email:contactRequired",
    );
    expect(
      issues(contactInputSchema, {
        ...contact,
        email: "",
        phone: "+962791234567",
      }),
    ).toEqual([]);
  });
  it("الموافقة التسويقية في التواصل تتطلب بريداً", () => {
    expect(
      issues(contactInputSchema, {
        ...contact,
        email: "",
        phone: "+962791234567",
        marketingConsent: true,
      }),
    ).toContain("marketingConsent:consentNeedsEmail");
  });
});
