import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("يقتبس الفواصل وعلامات الاقتباس والأسطر", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell("plain")).toBe("plain");
  });
  it.each(["=SUM(A1:A9)", "+1+1", "-2+3", "@cmd", "\t=1"])(
    "يحصّن %s من حقن المعادلات",
    (value) => {
      expect(csvCell(value).replace(/^"/, "")).toMatch(/^'/);
    },
  );
  it("القيم الفارغة والتواريخ", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(new Date("2026-01-02T03:04:05Z"))).toBe(
      "2026-01-02T03:04:05.000Z",
    );
    expect(csvCell(1001)).toBe("1001");
  });
});

describe("toCsv", () => {
  it("يبدأ بـ BOM ويفصل بـ CRLF", () => {
    const csv = toCsv(["a", "b"], [[1, "x,y"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('a,b\r\n1,"x,y"\r\n');
  });
});
