import { describe, expect, it, vi } from "vitest";
import { shouldPromoteToAdmin } from "./admin";
import { getEnabledOAuthProviders, isEmailLoginEnabled } from "./providers";
import { localeFromPath, sanitizeCallbackUrl } from "./safe-redirect";
import { adoptVerifiedEmail, type AdoptDb } from "./adopt-verified-email";

describe("getEnabledOAuthProviders", () => {
  it("لا يُظهر أي مزوّد دون متغيرات", () => {
    expect(getEnabledOAuthProviders({})).toEqual([]);
  });
  it("يُظهر المزوّد المضبوط فقط", () => {
    expect(
      getEnabledOAuthProviders({
        AUTH_GOOGLE_ID: "a",
        AUTH_GOOGLE_SECRET: "b",
      }),
    ).toEqual(["google"]);
  });
  it("Microsoft يحتاج الأسرار الثلاثة", () => {
    expect(
      getEnabledOAuthProviders({
        AUTH_MICROSOFT_ENTRA_ID_ID: "a",
        AUTH_MICROSOFT_ENTRA_ID_SECRET: "b",
      }),
    ).toEqual([]);
  });
});

describe("isEmailLoginEnabled", () => {
  it("في الإنتاج يتطلب Resend", () => {
    expect(isEmailLoginEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isEmailLoginEnabled({
        NODE_ENV: "production",
        RESEND_API_KEY: "k",
        EMAIL_FROM: "a@b.c",
      }),
    ).toBe(true);
  });
  it("خارج الإنتاج مفعّل للتطوير", () => {
    expect(isEmailLoginEnabled({ NODE_ENV: "development" })).toBe(true);
  });
});

describe("shouldPromoteToAdmin", () => {
  const adminEmail = "Admin@Example.com";
  it("يرقّي بريد المدير عبر مزوّد موثوق دون حساسية لحالة الأحرف", () => {
    expect(
      shouldPromoteToAdmin({
        email: "admin@example.com",
        provider: "google",
        adminEmail,
      }),
    ).toBe(true);
    expect(
      shouldPromoteToAdmin({
        email: "admin@example.com",
        provider: "resend",
        adminEmail,
      }),
    ).toBe(true);
  });
  it("لا يرقّي عبر Facebook أو Microsoft (بريد غير مضمون التوثيق)", () => {
    expect(
      shouldPromoteToAdmin({
        email: "admin@example.com",
        provider: "facebook",
        adminEmail,
      }),
    ).toBe(false);
    expect(
      shouldPromoteToAdmin({
        email: "admin@example.com",
        provider: "microsoft-entra-id",
        adminEmail,
      }),
    ).toBe(false);
  });
  it("لا يرقّي بريداً آخر أو عند غياب ADMIN_EMAIL", () => {
    expect(
      shouldPromoteToAdmin({
        email: "x@example.com",
        provider: "google",
        adminEmail,
      }),
    ).toBe(false);
    expect(
      shouldPromoteToAdmin({
        email: "admin@example.com",
        provider: "google",
        adminEmail: undefined,
      }),
    ).toBe(false);
  });
});

describe("sanitizeCallbackUrl", () => {
  it("يقبل المسارات الداخلية", () => {
    expect(sanitizeCallbackUrl("/ar/account?x=1", "/ar")).toBe(
      "/ar/account?x=1",
    );
  });
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "",
    undefined,
  ])("يرفض %s", (value) => {
    expect(sanitizeCallbackUrl(value, "/ar")).toBe("/ar");
  });
  it("يستخرج اللغة من المسار", () => {
    expect(localeFromPath("/en/account")).toBe("en");
    expect(localeFromPath("/other")).toBe("ar");
  });
});

describe("adoptVerifiedEmail", () => {
  function makeDb(user: { id: string; emailVerified: Date | null } | null) {
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
        update: vi.fn().mockResolvedValue({}),
      },
      account: { deleteMany: vi.fn().mockResolvedValue({}) },
      session: { deleteMany: vi.fn().mockResolvedValue({}) },
    };
    return db satisfies AdoptDb;
  }
  it("يزيل حسابات المستخدم غير الموثّق ويوثّق بريده", async () => {
    const db = makeDb({ id: "u1", emailVerified: null });
    await adoptVerifiedEmail(db, " A@B.com ");
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
    });
    expect(db.account.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(db.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(db.user.update).toHaveBeenCalled();
  });
  it("لا يمس مستخدماً موثّقاً أو غير موجود", async () => {
    const verified = makeDb({ id: "u1", emailVerified: new Date() });
    await adoptVerifiedEmail(verified, "a@b.com");
    expect(verified.account.deleteMany).not.toHaveBeenCalled();
    const none = makeDb(null);
    await adoptVerifiedEmail(none, "a@b.com");
    expect(none.user.update).not.toHaveBeenCalled();
  });
});
