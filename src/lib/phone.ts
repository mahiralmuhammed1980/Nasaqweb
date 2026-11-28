/**
 * يوحّد رقم الهاتف إلى صيغة دولية E.164 (+9627...). يشترط رمز الدولة.
 * يعيد null لرقم غير صالح.
 */
export function normalizePhone(input: string): string | null {
  let value = input.trim().replace(/[\s\-().]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  return /^\+[1-9]\d{7,14}$/.test(value) ? value : null;
}

/** الأرقام فقط، لروابط wa.me */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
