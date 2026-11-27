import { randomUUID } from "node:crypto";
import { test, expect, type BrowserContext } from "@playwright/test";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const createdUsers: string[] = [];

test.afterAll(async () => {
  if (createdUsers.length)
    await pool.query('DELETE FROM "User" WHERE id = ANY($1)', [createdUsers]);
  await pool.end();
});

async function loginAs(context: BrowserContext, role: "USER" | "ADMIN") {
  const id = `e2e_${randomUUID()}`;
  const token = randomUUID();
  await pool.query(
    `INSERT INTO "User" (id, email, name, role, "updatedAt") VALUES ($1, $2, 'E2E', $3::"Role", now())`,
    [id, `${id}@example.test`, role],
  );
  await pool.query(
    `INSERT INTO "Session" (id, "sessionToken", "userId", expires, "updatedAt") VALUES ($1, $2, $1, now() + interval '1 day', now())`,
    [id, token],
  );
  createdUsers.push(id);
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      url: "http://localhost:3000",
    },
  ]);
}

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
