import { describe, expect, it } from "vitest";
import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("ينسّق حسب اللغة", () => {
    expect(formatMoney(299, "USD", "en")).toBe("$299");
    expect(formatMoney(29.5, "USD", "en")).toBe("$29.50");
    expect(formatMoney(299, "USD", "ar")).toMatch(/٢٩٩|299/);
  });
});
