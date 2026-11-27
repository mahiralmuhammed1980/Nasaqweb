import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/i18n/navigation", () => ({
  redirect: ({ href }: { href: unknown }) => {
    throw new Error(`REDIRECT:${JSON.stringify(href)}`);
  },
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

const { adminAction } = await import("./admin-action");
const { adminPing } = await import("./ping");
const { requireAdminPage, requireUserPage } =
  await import("@/lib/auth/page-guards");

const session = (role: "USER" | "ADMIN") => ({
  user: { id: "u1", role },
  expires: "2099-01-01",
});

beforeEach(() => authMock.mockReset());

describe("Server Action إداري", () => {
  it("يرفض مستخدماً عادياً ولا يستدعي المعالج", async () => {
    authMock.mockResolvedValue(session("USER"));
    const handler = vi.fn().mockResolvedValue("done");
    const action = adminAction(z.object({}), handler);
    expect(await action({})).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(handler).not.toHaveBeenCalled();
    expect(await adminPing({})).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("يرفض الزائر غير المسجّل", async () => {
    authMock.mockResolvedValue(null);
    const handler = vi.fn();
    expect(await adminAction(z.object({}), handler)({})).toEqual({
      ok: false,
      error: "UNAUTHORIZED",
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("يتحقق بـ Zod قبل أي فحص صلاحية", async () => {
    const handler = vi.fn();
    expect(
      await adminAction(z.object({ n: z.number() }), handler)({ n: "x" }),
    ).toEqual({
      ok: false,
      error: "VALIDATION",
    });
    expect(authMock).not.toHaveBeenCalled();
  });

  it("يسمح للمدير", async () => {
    authMock.mockResolvedValue(session("ADMIN"));
    expect(await adminPing({})).toEqual({ ok: true, data: { adminId: "u1" } });
  });
});

describe("حراس صفحات الإدارة والحساب", () => {
  it("مستخدم USER يُرفض من /admin (404)", async () => {
    authMock.mockResolvedValue(session("USER"));
    await expect(requireAdminPage("ar", "/admin")).rejects.toThrow("NOT_FOUND");
  });

  it("الزائر يُحوَّل إلى /login مع callbackUrl", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireUserPage("ar", "/account")).rejects.toThrow(
      /REDIRECT.*login.*\/ar\/account/,
    );
    await expect(requireAdminPage("en", "/admin")).rejects.toThrow(
      /REDIRECT.*login.*\/en\/admin/,
    );
  });

  it("المدير يدخل", async () => {
    authMock.mockResolvedValue(session("ADMIN"));
    await expect(requireAdminPage("ar", "/admin")).resolves.toMatchObject({
      role: "ADMIN",
    });
  });
});
