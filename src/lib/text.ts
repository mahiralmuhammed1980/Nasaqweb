/** سطور نص → مصفوفة (للميزات داخل الخطة): تُهمل الأسطر الفارغة. */
export function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
