import { describe, expect, it } from "vitest";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "./unsubscribe-token";

const secret = "test-secret";

describe("unsubscribe token", () => {
  it("ذهاباً وإياباً مع تطبيع البريد", () => {
    const token = createUnsubscribeToken(
      { email: " A@B.com ", channel: "EMAIL" },
      secret,
    );
    expect(verifyUnsubscribeToken(token, secret)).toEqual({
      email: "a@b.com",
      channel: "EMAIL",
    });
  });
  it("يرفض التلاعب بالحمولة أو التوقيع", () => {
    const token = createUnsubscribeToken({ email: "a@b.com" }, secret);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ email: "victim@x.com" }),
    ).toString("base64url");
    expect(verifyUnsubscribeToken(`${forged}.${sig}`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(`${payload}.${sig}x`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(`${payload}.`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(`${token}.extra`, secret)).toBeNull();
  });
  it("يرفض توقيع سرّ آخر وقيماً عشوائية", () => {
    const token = createUnsubscribeToken({ phone: "+962791234567" }, secret);
    expect(verifyUnsubscribeToken(token, "other-secret")).toBeNull();
    for (const bad of ["", "abc", "a.b", "....", "💥"])
      expect(verifyUnsubscribeToken(bad, secret)).toBeNull();
  });
  it("يشترط وجود هوية", () => {
    const token = createUnsubscribeToken({}, secret);
    expect(verifyUnsubscribeToken(token, secret)).toBeNull();
  });
});
