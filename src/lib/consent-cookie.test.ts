import { describe, expect, it } from "vitest";
import { readAnalyticsConsent } from "./consent-cookie";

const cookie = (value: unknown) =>
  `a=1; consent=${encodeURIComponent(JSON.stringify(value))}; b=2`;

describe("readAnalyticsConsent", () => {
  it("يقرأ القبول والرفض", () => {
    expect(readAnalyticsConsent(cookie({ analytics: true }))).toBe(true);
    expect(readAnalyticsConsent(cookie({ analytics: false }))).toBe(false);
  });
  it("غياب الكوكي أو فساده يعني لا موافقة", () => {
    expect(readAnalyticsConsent("")).toBe(false);
    expect(readAnalyticsConsent("a=1")).toBe(false);
    expect(readAnalyticsConsent("consent=%7Bbad")).toBe(false);
    expect(readAnalyticsConsent(cookie("yes"))).toBe(false);
  });
});
