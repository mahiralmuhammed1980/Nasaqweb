import { describe, expect, it } from "vitest";
import { normalizePhone, phoneDigits } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["+962 79 123 4567", "+962791234567"],
    ["00962-79-123-4567", "+962791234567"],
    ["+1 (415) 555-0123", "+14155550123"],
  ])("يوحّد %s", (input, expected) =>
    expect(normalizePhone(input)).toBe(expected),
  );

  it.each(["0791234567", "123", "+0123456789", "abc", "", "+962 79 12"])(
    "يرفض %s (بلا رمز دولة أو غير صالح)",
    (input) => expect(normalizePhone(input)).toBeNull(),
  );

  it("الأرقام فقط لروابط wa.me", () =>
    expect(phoneDigits("+962791234567")).toBe("962791234567"));
});
