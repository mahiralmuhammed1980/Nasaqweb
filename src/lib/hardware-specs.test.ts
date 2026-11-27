import { describe, expect, it } from "vitest";
import { parseSpecs, specKey } from "./hardware-specs";

describe("parseSpecs", () => {
  it("يقرأ العناصر الصالحة ويهمل غيرها", () => {
    const specs = parseSpecs([
      { keyAr: "الدقة", keyEn: "Resolution", value: "203 dpi" },
      { keyAr: "", keyEn: "x", value: "y" },
      "bad",
      null,
    ]);
    expect(specs).toHaveLength(1);
  });
  it("يعيد مصفوفة فارغة لغير المصفوفات", () => {
    expect(parseSpecs(null)).toEqual([]);
    expect(parseSpecs({})).toEqual([]);
  });
  it("المفتاح الإنجليزي يعود للعربي إن غاب", () => {
    const spec = { keyAr: "الدقة", keyEn: "", value: "1" };
    expect(specKey(spec, "en")).toBe("الدقة");
    expect(specKey({ ...spec, keyEn: "Resolution" }, "en")).toBe("Resolution");
  });
});
