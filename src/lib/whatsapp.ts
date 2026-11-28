import { phoneDigits } from "./phone";

/** رابط wa.me برسالة معبّأة. يعيد null إن لم يوجد رقم صالح. */
export function whatsappUrl(
  number: string | null | undefined,
  text?: string,
): string | null {
  const digits = number ? phoneDigits(number) : "";
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
