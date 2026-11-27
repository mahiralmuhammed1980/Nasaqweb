import { z } from "zod";
import { hardwareSpecSchema } from "@/lib/hardware-specs";
import { SLUG_PATTERN } from "./product";

const imageUrl = z
  .string()
  .trim()
  .min(1, "required")
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v),
    "invalidUrl",
  );

const translation = z.object({
  name: z.string().trim().max(160),
  description: z.string().trim().max(5000),
});

export const hardwareSchema = z
  .object({
    id: z.string().min(1).max(40).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "required")
      .max(80)
      .regex(SLUG_PATTERN, "invalidSlug"),
    categoryId: z.string().min(1).max(40).nullable(),
    brand: z.string().trim().min(1, "required").max(80),
    model: z.string().trim().min(1, "required").max(80),
    priceType: z.enum(["FIXED", "FROM", "ON_REQUEST"]),
    price: z.number().min(0).max(100_000_000).nullable(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "invalidCurrency"),
    inStock: z.boolean(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    images: z.array(z.object({ url: imageUrl })).max(10),
    specs: z
      .array(
        hardwareSpecSchema.extend({
          keyAr: z.string().trim().min(1, "required").max(100),
        }),
      )
      .max(40),
    ar: translation,
    en: translation,
    productIds: z.array(z.string().min(1).max(40)).max(200),
  })
  .superRefine((value, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    if (!value.ar.name) issue(["ar", "name"], "required");
    if (
      value.priceType !== "ON_REQUEST" &&
      (value.price === null || value.price <= 0)
    )
      issue(["price"], "priceRequired");
    if (value.en.description && !value.en.name)
      issue(["en", "name"], "required");
    if (value.status === "PUBLISHED" && value.images.length === 0)
      issue(["images"], "imageRequired");
  });

export type HardwareInput = z.infer<typeof hardwareSchema>;
export type HardwareFormValues = z.input<typeof hardwareSchema>;
