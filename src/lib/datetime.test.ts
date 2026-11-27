import { describe, expect, it } from "vitest";
import { fromLocalInput, offerState, toLocalInput } from "./datetime";

describe("datetime-local", () => {
  it("يرجع إلى نفس اللحظة بعد التحويل ذهاباً وإياباً", () => {
    const iso = "2026-06-15T09:30:00.000Z";
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });
  it("قيمة غير صالحة تعطي نصاً فارغاً", () => {
    expect(toLocalInput("nope")).toBe("");
  });
});

describe("offerState", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const at = (h: number) => new Date(now.getTime() + h * 3600_000);
  it("قادم وسارٍ ومنتهٍ ومعطَّل", () => {
    expect(
      offerState({ startsAt: at(1), endsAt: at(5), isActive: true }, now),
    ).toBe("UPCOMING");
    expect(
      offerState({ startsAt: at(-1), endsAt: at(5), isActive: true }, now),
    ).toBe("ACTIVE");
    expect(
      offerState({ startsAt: at(-5), endsAt: at(-1), isActive: true }, now),
    ).toBe("EXPIRED");
    expect(
      offerState({ startsAt: at(-1), endsAt: at(5), isActive: false }, now),
    ).toBe("DISABLED");
  });
});
