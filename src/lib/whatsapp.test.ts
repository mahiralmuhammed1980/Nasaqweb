import { describe, expect, it } from "vitest";
import { whatsappUrl } from "./whatsapp";

describe("whatsappUrl", () => {
  it("يبني رابطاً بالأرقام فقط ورسالة مرمّزة", () => {
    expect(whatsappUrl("+962 79 123 4567", "مرحباً")).toBe(
      `https://wa.me/962791234567?text=${encodeURIComponent("مرحباً")}`,
    );
    expect(whatsappUrl("+962791234567")).toBe("https://wa.me/962791234567");
  });
  it("بلا رقم صالح لا رابط", () => {
    expect(whatsappUrl("")).toBeNull();
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl("123")).toBeNull();
  });
});
