import { test, expect } from "@playwright/test";
import { cleanupUsers, loginAs } from "./helpers";

test.afterAll(async () => {
  await cleanupUsers();
});

test("الزائر يُحوَّل من /account إلى /login مع callbackUrl", async ({ page }) => {
  await page.goto("/ar/account");
  await expect(page).toHaveURL(/\/ar\/login\?callbackUrl=%2Far%2Faccount/);
});

test("الزائر يُحوَّل من /admin إلى /login", async ({ page }) => {
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/login\?callbackUrl=%2Fen%2Fadmin/);
});

test("المزوّد غير المضبوط لا يظهر زره", async ({ page }) => {
  await page.goto("/ar/login");
  await expect(
    page.getByRole("heading", { name: "تسجيل الدخول" }),
  ).toBeVisible();
  for (const name of [/Google/, /Facebook/, /Microsoft/]) {
    await expect(page.getByRole("button", { name })).toHaveCount(0);
  }
});

test("مستخدم USER يدخل /account ويُرفض من /admin", async ({ page, context }) => {
  await loginAs(context, "USER");
  await page.goto("/ar/account");
  await expect(page.getByRole("heading", { name: "حسابي" })).toBeVisible();
  const response = await page.goto("/ar/admin");
  expect(response?.status()).toBe(404);
});

test("المدير يدخل /admin", async ({ page, context }) => {
  await loginAs(context, "ADMIN");
  const response = await page.goto("/ar/admin");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "لوحة التحكم" }),
  ).toBeVisible();
});

test("قائمة الحساب تعرض رابط الإدارة للمدير فقط", async ({ page, context }) => {
  await loginAs(context, "ADMIN");
  await page.goto("/en");
  await page.getByText("E2E").click();
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
});
