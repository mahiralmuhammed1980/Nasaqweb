import { describe, expect, it } from "vitest";
import { pickTranslation } from "./localized";

const ar = { locale: "ar", name: "عربي" };
const en = { locale: "en", name: "English" };

describe("pickTranslation", () => {
  it("يعيد ترجمة اللغة المطلوبة", () => {
    expect(pickTranslation([ar, en], "en")).toBe(en);
  });
  it("يعود إلى العربية إن لم توجد الإنجليزية", () => {
    expect(pickTranslation([ar], "en")).toBe(ar);
  });
  it("يعيد أول ترجمة إن غابت العربية والمطلوبة", () => {
    expect(pickTranslation([en], "ar")).toBe(en);
  });
  it("يعيد undefined لقائمة فارغة", () => {
    expect(pickTranslation([], "ar")).toBeUndefined();
  });
});
