import { describe, expect, it } from "vitest";
import { parseProductFilters } from "./catalog-filters";

describe("parseProductFilters", () => {
  it("يقبل القيم الصحيحة", () => {
    expect(
      parseProductFilters({
        type: "SAAS",
        category: "pos",
        q: " كاشير ",
        sort: "price_asc",
      }),
    ).toEqual({
      type: "SAAS",
      category: "pos",
      q: "كاشير",
      sort: "price_asc",
    });
  });
  it("يهمل القيم غير الصالحة ويرجع للترتيب الافتراضي", () => {
    expect(parseProductFilters({ type: "WRONG", sort: "bad" })).toEqual({
      type: undefined,
      category: undefined,
      q: undefined,
      sort: "featured",
    });
  });
  it("يأخذ أول قيمة عند التكرار", () => {
    expect(parseProductFilters({ type: ["APK", "EXE"] }).type).toBe("APK");
  });
});
