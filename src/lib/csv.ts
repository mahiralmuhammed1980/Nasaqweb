/**
 * خلية CSV آمنة: تُحاط بعلامات اقتباس عند الحاجة، وتُحصَّن من «حقن المعادلات» في Excel
 * (قيمة تبدأ بـ = + - @ أو Tab/CR تُسبَق بفاصلة عليا) لأن الطلبات يكتبها زوار مجهولون.
 */
export function csvCell(value: unknown): string {
  let text =
    value === null || value === undefined
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  // BOM كي يفتح Excel الملف بترميز UTF-8 (العربية)
  return `﻿${lines.join("\r\n")}\r\n`;
}
