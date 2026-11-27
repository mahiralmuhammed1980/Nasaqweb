import { z } from "zod";
import { SLUG_PATTERN } from "./product";

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v),
    "invalidUrl",
  );

const optionalImage = z
  .union([z.literal(""), imageUrl])
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const translation = z.object({
  title: z.string().trim().max(160),
  description: z.string().trim().max(1000),
  terms: z.string().max(5000),
});

/** نبني المخطط بحقل تاريخ مختلف: النموذج يرسل نصاً محلياً، والخادم يستقبل ISO. */
function buildOfferSchema(date: z.ZodType<string, string>) {
  return z
    .object({
      id: z.string().min(1).max(40).optional(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, "required")
        .max(80)
        .regex(SLUG_PATTERN, "invalidSlug"),
      discountType: z.enum(["PERCENT", "FIXED"]),
      discountValue: z.number().positive("discountPositive").max(100_000_000),
      startsAt: date,
      endsAt: date,
      isActive: z.boolean(),
      bannerImage: optionalImage,
      couponCode: optionalText(40),
      ar: translation,
      en: translation,
      productIds: z.array(z.string().min(1).max(40)).max(200),
    })
    .superRefine((value, ctx) => {
      const issue = (path: (string | number)[], message: string) =>
        ctx.addIssue({ code: "custom", path, message });
      if (!value.ar.title) issue(["ar", "title"], "required");
      if (value.discountType === "PERCENT" && value.discountValue > 100)
        issue(["discountValue"], "percentMax");
      if (Date.parse(value.endsAt) <= Date.parse(value.startsAt))
        issue(["endsAt"], "endAfterStart");
      if (value.en.description || value.en.terms) {
        if (!value.en.title) issue(["en", "title"], "required");
      }
    });
}

const validDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "invalidDate");

/** الخادم: التاريخ ISO بمنطقة زمنية صريحة (UTC) */
export const offerSchema = buildOfferSchema(z.iso.datetime());
/** النموذج: يقبل قيمة datetime-local ثم يحوّلها إلى ISO عند الإرسال */
export const offerFormSchema = buildOfferSchema(validDate);

export type OfferInput = z.infer<typeof offerSchema>;
export type OfferFormValues = z.input<typeof offerFormSchema>;
