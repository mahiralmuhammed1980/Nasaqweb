import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const phone = z
  .string()
  .trim()
  .max(40)
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) ctx.addIssue({ code: "custom", message: "invalidPhone" });
    return normalized ?? "";
  });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.email().safeParse(v).success, "invalidEmail");

/** مسار داخلي فقط (الصفحة التي فُتح منها النموذج)، لا روابط خارجية */
const internalPath = z
  .string()
  .max(300)
  .optional()
  .transform((v) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null));

const locale = z.enum(["ar", "en"]);

export const orderInputSchema = z
  .object({
    productSlug: z.string().trim().max(80).optional(),
    hardwareSlug: z.string().trim().max(80).optional(),
    planId: z.string().trim().max(40).optional(),
    name: z.string().trim().min(2, "required").max(120),
    phone,
    phoneHasWhatsapp: z.boolean(),
    email,
    company: optionalText(120),
    city: optionalText(100),
    country: optionalText(100),
    preferredChannel: z.enum(["WHATSAPP", "PHONE", "EMAIL"]),
    message: optionalText(2000),
    marketingConsent: z.boolean(),
    locale,
    referrer: internalPath,
    utmSource: optionalText(100),
    utmMedium: optionalText(100),
    utmCampaign: optionalText(100),
    turnstileToken: z.string().max(4096).optional(),
  })
  .superRefine((value, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    const hasProduct = Boolean(value.productSlug);
    const hasHardware = Boolean(value.hardwareSlug);
    if (hasProduct === hasHardware) issue("productSlug", "targetRequired");
    if (value.planId && !hasProduct) issue("planId", "planNeedsProduct");
    if (value.preferredChannel === "EMAIL" && !value.email)
      issue("email", "emailRequiredForChannel");
    if (value.marketingConsent && !value.email && !value.phoneHasWhatsapp)
      issue("marketingConsent", "consentNeedsChannel");
  });

export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderFormValues = z.input<typeof orderInputSchema>;

export const contactInputSchema = z
  .object({
    name: z.string().trim().min(2, "required").max(120),
    email,
    phone: z
      .string()
      .trim()
      .max(40)
      .nullish()
      .transform((value, ctx) => {
        if (!value) return null;
        const normalized = normalizePhone(value);
        if (!normalized)
          ctx.addIssue({ code: "custom", message: "invalidPhone" });
        return normalized;
      }),
    subject: z.string().trim().min(2, "required").max(160),
    message: z.string().trim().min(5, "required").max(5000),
    marketingConsent: z.boolean(),
    locale,
    turnstileToken: z.string().max(4096).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone)
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "contactRequired",
      });
    if (value.marketingConsent && !value.email)
      ctx.addIssue({
        code: "custom",
        path: ["marketingConsent"],
        message: "consentNeedsEmail",
      });
  });

export type ContactInput = z.infer<typeof contactInputSchema>;
export type ContactFormValues = z.input<typeof contactInputSchema>;
