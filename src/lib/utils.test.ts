import { describe, expect, it } from "vitest";
import { cn } from "./utils";
import { getDirection, isLocale } from "@/i18n/routing";

describe("cn", () => {
  it("يدمج الفئات ويحل التعارض", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("routing", () => {
  it("العربية rtl والإنجليزية ltr", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });
  it("يتحقق من اللغات المدعومة", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});
