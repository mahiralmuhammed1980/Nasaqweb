import { describe, expect, it } from "vitest";
import { channelsForForm, currentConsent, type ConsentRow } from "./consent";

const at = (n: number) => new Date(2026, 0, n);
const row = (
  channel: ConsentRow["channel"],
  granted: boolean,
  day: number,
): ConsentRow => ({ channel, granted, createdAt: at(day) });

describe("currentConsent", () => {
  it("لا سجلات: لم يوافق على شيء", () => {
    expect(currentConsent([])).toEqual({
      EMAIL: false,
      WHATSAPP: false,
      SMS: false,
    });
  });
  it("آخر سجل لكل قناة هو الحاسم، بغض النظر عن ترتيب الإدخال", () => {
    const state = currentConsent([
      row("EMAIL", false, 5),
      row("EMAIL", true, 1),
      row("WHATSAPP", true, 2),
    ]);
    expect(state).toEqual({ EMAIL: false, WHATSAPP: true, SMS: false });
  });
  it("موافقة بعد سحب تعيد التفعيل", () => {
    expect(
      currentConsent([
        row("SMS", true, 1),
        row("SMS", false, 2),
        row("SMS", true, 3),
      ]).SMS,
    ).toBe(true);
  });
  it("القنوات مستقلة", () => {
    expect(currentConsent([row("EMAIL", false, 9)]).WHATSAPP).toBe(false);
  });
});

describe("channelsForForm", () => {
  it("البريد وواتساب حسب ما قدّمه الزائر فقط", () => {
    expect(channelsForForm({ email: "a@b.c", phoneHasWhatsapp: true })).toEqual(
      ["EMAIL", "WHATSAPP"],
    );
    expect(channelsForForm({ email: null, phoneHasWhatsapp: true })).toEqual([
      "WHATSAPP",
    ]);
    expect(channelsForForm({ email: "a@b.c" })).toEqual(["EMAIL"]);
    expect(channelsForForm({})).toEqual([]);
  });
});
