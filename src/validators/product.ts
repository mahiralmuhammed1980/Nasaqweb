import { z } from "zod";
import { FEATURE_ICON_NAMES } from "@/lib/feature-icons";
import { isValidVideoId } from "@/lib/video";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** رابط صورة: مسار محلي يبدأ بـ / أو https فقط (لا data: ولا javascript:) */
const imageUrl = z
  .string()
  .trim()
  .min(1, "required")
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v),
    "invalidUrl",
  );

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https:\/\/[^\s]+$/.test(v), "invalidUrl");

const optionalHttpsUrl = z
  .union([z.literal(""), httpsUrl])
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable();

const idField = z.string().min(1).max(40).optional();

export const productTranslationSchema = z.object({
  name: z.string().trim().max(120),
  tagline: z.string().trim().max(240),
  description: z.string().max(20000),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});

export const featureSchema = z.object({
  id: idField,
  icon: z.enum(FEATURE_ICON_NAMES as [string, ...string[]]),
  ar: z.object({
    title: z.string().trim().min(1, "required").max(120),
    description: z.string().trim().max(500),
  }),
  en: z.object({
    title: z.string().trim().max(120),
    description: z.string().trim().max(500),
  }),
});

export const mediaSchema = z.object({
  id: idField,
  url: imageUrl,
  altAr: z.string().trim().max(200),
  altEn: z.string().trim().max(200),
});

export const planSchema = z.object({
  id: idField,
  price: z.number().min(0).max(100_000_000),
  billingPeriod: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]),
  highlighted: z.boolean(),
  ar: z.object({
    name: z.string().trim().min(1, "required").max(80),
    featuresText: z.string().max(2000),
  }),
  en: z.object({
    name: z.string().trim().max(80),
    featuresText: z.string().max(2000),
  }),
});

export const faqSchema = z.object({
  id: idField,
  ar: z.object({
    question: z.string().trim().min(1, "required").max(300),
    answer: z.string().trim().min(1, "required").max(2000),
  }),
  en: z.object({
    question: z.string().trim().max(300),
    answer: z.string().trim().max(2000),
  }),
});

export const productSchema = z
  .object({
    id: idField,
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "required")
      .max(80)
      .regex(SLUG_PATTERN, "invalidSlug"),
    type: z.enum(["EXE", "SAAS", "APK"]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    categoryId: z.string().min(1).max(40).nullable(),
    priceType: z.enum(["FIXED", "FROM", "ON_REQUEST"]),
    price: z.number().min(0).max(100_000_000).nullable(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "invalidCurrency"),
    featured: z.boolean(),
    sortOrder: z.number().int().min(0).max(100000),
    version: optionalText(40),
    platforms: z.string().trim().max(200),
    coverImage: imageUrl,
    demoUrl: optionalHttpsUrl,
    demoUsername: optionalText(200),
    demoPassword: optionalText(200),
    demoEmbeddable: z.boolean(),
    videoProvider: z.enum(["YOUTUBE", "BUNNY"]).nullable(),
    videoId: optionalText(80),
    trialDownloadUrl: optionalHttpsUrl,
    ar: productTranslationSchema,
    en: productTranslationSchema,
    features: z.array(featureSchema).max(30),
    media: z.array(mediaSchema).max(20),
    plans: z.array(planSchema).max(6),
    faqs: z.array(faqSchema).max(30),
  })
  .superRefine((value, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    if (!value.ar.name) issue(["ar", "name"], "required");
    if (!value.ar.tagline) issue(["ar", "tagline"], "required");
    if (
      value.priceType !== "ON_REQUEST" &&
      (value.price === null || value.price <= 0)
    )
      issue(["price"], "priceRequired");
    if (Boolean(value.videoProvider) !== Boolean(value.videoId))
      issue(["videoId"], "videoBoth");
    if (
      value.videoProvider &&
      value.videoId &&
      !isValidVideoId(value.videoProvider, value.videoId)
    ) {
      issue(["videoId"], "videoInvalid");
    }
    // الإنجليزية اختيارية، لكن إن كُتب جزء منها فالاسم والسطر التعريفي مطلوبان
    const enStarted = value.en.name || value.en.tagline || value.en.description;
    if (enStarted && !value.en.name) issue(["en", "name"], "required");
    if (enStarted && !value.en.tagline) issue(["en", "tagline"], "required");
  });

export type ProductInput = z.infer<typeof productSchema>;
/** شكل النموذج قبل التحويل (Zod transform) */
export type ProductFormValues = z.input<typeof productSchema>;

export const categorySchema = z.object({
  id: idField,
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "required")
    .max(80)
    .regex(SLUG_PATTERN, "invalidSlug"),
  sortOrder: z.number().int().min(0).max(100000),
  ar: z.object({ name: z.string().trim().min(1, "required").max(80) }),
  en: z.object({ name: z.string().trim().max(80) }),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const idSchema = z.object({ id: z.string().min(1).max(40) });

export const imageUploadSchema = z.object({
  contentType: z.string().max(100),
  size: z.number(),
});
