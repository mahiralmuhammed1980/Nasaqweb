import { z } from "zod";

export const PRODUCT_SORTS = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
] as const;
export const PRODUCT_TYPE_FILTERS = ["EXE", "SAAS", "APK"] as const;

export const productFiltersSchema = z.object({
  type: z.enum(PRODUCT_TYPE_FILTERS).optional().catch(undefined),
  category: z.string().trim().max(80).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  sort: z.enum(PRODUCT_SORTS).catch("featured"),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;

/** يحوّل query params الخام إلى فلاتر آمنة (أي قيمة غير صالحة تُهمل). */
export function parseProductFilters(
  raw: Record<string, string | string[] | undefined>,
): ProductFilters {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  return productFiltersSchema.parse({
    type: first(raw.type),
    category: first(raw.category) || undefined,
    q: first(raw.q) || undefined,
    sort: first(raw.sort),
  });
}
