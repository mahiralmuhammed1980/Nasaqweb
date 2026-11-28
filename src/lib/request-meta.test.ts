import { describe, expect, it } from "vitest";
import { getClientIp, hashIp } from "./request-meta";

const headers = (map: Record<string, string>) => ({
  get: (name: string) => map[name.toLowerCase()] ?? null,
});

describe("getClientIp", () => {
  it("يفضّل ترويسة Vercel الموثوقة", () => {
    expect(
      getClientIp(
        headers({
          "x-vercel-forwarded-for": "1.1.1.1",
          "x-forwarded-for": "9.9.9.9",
        }),
      ),
    ).toBe("1.1.1.1");
  });
  it("ثم أول قيمة من x-forwarded-for ثم x-real-ip", () => {
    expect(
      getClientIp(headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" })),
    ).toBe("2.2.2.2");
    expect(getClientIp(headers({ "x-real-ip": "4.4.4.4" }))).toBe("4.4.4.4");
    expect(getClientIp(headers({}))).toBe("unknown");
  });
});

describe("hashIp", () => {
  it("لا يعيد IP خاماً، وثابت لنفس المدخل والملح", () => {
    const a = hashIp("1.2.3.4", "salt");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("1.2.3.4");
    expect(hashIp("1.2.3.4", "salt")).toBe(a);
  });
  it("الملح يغيّر الناتج", () => {
    expect(hashIp("1.2.3.4", "a")).not.toBe(hashIp("1.2.3.4", "b"));
  });
});
