import { z } from "zod";
import type { Locale } from "@/i18n/routing";

export const hardwareSpecSchema = z.object({
  keyAr: z.string().trim().min(1).max(100),
  keyEn: z.string().trim().max(100),
  value: z.string().trim().min(1).max(300),
});
export const hardwareSpecsSchema = z.array(hardwareSpecSchema).max(40);
export type HardwareSpec = z.infer<typeof hardwareSpecSchema>;

/** يقرأ حقل specs (JSON) بأمان: أي عنصر غير صالح يُهمل */
export function parseSpecs(raw: unknown): HardwareSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = hardwareSpecSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function specKey(spec: HardwareSpec, locale: Locale): string {
  return (locale === "en" ? spec.keyEn : spec.keyAr) || spec.keyAr;
}
