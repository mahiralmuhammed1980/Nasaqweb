import { randomInt, randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { Pool } from "pg";
import "dotenv/config";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  allowExitOnIdle: true,
});
const createdUsers: string[] = [];

export async function loginAs(context: BrowserContext, role: "USER" | "ADMIN") {
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

export async function cleanupUsers() {
  if (createdUsers.length)
    await pool.query('DELETE FROM "User" WHERE id = ANY($1)', [createdUsers]);
  createdUsers.length = 0;
}

/** سياق متصفح بعنوان IP مستقل (x-forwarded-for) كي لا تتشارك الاختبارات حد الإرسال. */
export async function visitorContext(
  browser: import("@playwright/test").Browser,
  ip?: string,
) {
  const address =
    ip ?? `10.${randomInt(1, 250)}.${randomInt(1, 250)}.${randomInt(1, 250)}`;
  return browser.newContext({
    extraHTTPHeaders: { "x-forwarded-for": address },
    baseURL: "http://localhost:3000",
  });
}

/**
 * ConsentRecord للإضافة فقط (مشغّل يمنع UPDATE/DELETE)، فننظّفه في الاختبارات بـ TRUNCATE.
 * محصور بقاعدة محلية فقط كي لا يمسح بيانات حقيقية.
 */
export async function resetConsentRecords() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url))
    throw new Error(
      "Refusing to truncate ConsentRecord on a non-local database",
    );
  await pool.query('TRUNCATE "ConsentRecord"');
}
