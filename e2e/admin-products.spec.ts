import { test, expect, type Page } from "@playwright/test";
import { cleanupUsers, loginAs, pool } from "./helpers";

const slug = `e2e-${Date.now()}`;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await pool.query(`DELETE FROM "Product" WHERE slug LIKE 'e2e-%'`);
  await pool.query(`DELETE FROM "Category" WHERE slug LIKE 'e2e-%'`);
  await cleanupUsers();
});

async function fillArabicAndEnglish(page: Page) {
  const ar = page.locator("#panel-ar");
  await ar.getByLabel("Name").fill("تطبيق اختبار");
  await ar.getByLabel("Tagline").fill("سطر تعريفي للاختبار");
  await page.getByRole("tab", { name: "English" }).click();
  const en = page.locator("#panel-en");
  await en.getByLabel("Name").fill("E2E Test App");
  await en.getByLabel("Tagline").fill("An end-to-end test tagline");
}

async function save(page: Page) {
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
}

test("المدير ينشئ منتجاً بالعربية والإنجليزية وينشره فيظهر فوراً", async ({
  page,
  context,
}) => {
  await loginAs(context, "ADMIN");
  await page.goto("/en/admin/products/new");
  await page.getByLabel("URL slug").fill(slug);
  await page.getByLabel("Status").selectOption("PUBLISHED");
  await page.getByLabel("Cover", { exact: true }).fill("/seed/saas-cover.png");
  await fillArabicAndEnglish(page);
  await page.getByLabel("Demo URL").fill("https://example.com/demo");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/admin\/products\/(?!new$)[a-z0-9]+$/);

  // يظهر فوراً في القائمة وصفحته بالعربية والإنجليزية (ISR مُبطَل عند الحفظ)
  await page.goto("/ar/products");
  await expect(
    page.getByRole("heading", { name: "تطبيق اختبار" }),
  ).toBeVisible();
  await page.goto(`/ar/products/${slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "تطبيق اختبار" }),
  ).toBeVisible();
  await page.goto(`/en/products/${slug}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "E2E Test App" }),
  ).toBeVisible();
  await page.goto("/en");
  // غير مميّز: لا يظهر في الرئيسية
  await expect(page.getByText("E2E Test App")).toHaveCount(0);
});

test("المسودة لا تظهر للعامة ولا في sitemap، والمعاينة للمدير فقط", async ({
  page,
  context,
  browser,
}) => {
  await loginAs(context, "ADMIN");
  const { rows } = await pool.query(
    `SELECT id FROM "Product" WHERE slug = $1`,
    [slug],
  );
  const id = rows[0].id as string;

  await page.goto(`/en/admin/products/${id}`);
  await page.getByLabel("Status").selectOption("DRAFT");
  await save(page);

  const visitor = await browser.newContext();
  const guest = await visitor.newPage();
  expect((await guest.goto(`/ar/products/${slug}`))?.status()).toBe(404);
  await guest.goto("/ar/products?q=" + encodeURIComponent("تطبيق اختبار"));
  await expect(guest.getByText("لا توجد تطبيقات مطابقة")).toBeVisible();
  const sitemap = await guest.request.get("/sitemap.xml");
  expect(await sitemap.text()).not.toContain(slug);

  // المدير يعاين المسودة
  await page.goto(`/en/admin/products/${id}/preview`);
  await expect(page.getByRole("note")).toContainText("Draft");
  await expect(
    page.getByRole("heading", { level: 1, name: "E2E Test App" }),
  ).toBeVisible();
  // الزائر لا يدخل المعاينة
  await guest.goto(`/en/admin/products/${id}/preview`);
  await expect(guest).toHaveURL(/\/en\/login/);

  // النشر مجدداً يضيفه إلى sitemap
  await page.goto(`/en/admin/products/${id}`);
  await page.getByLabel("Status").selectOption("PUBLISHED");
  await save(page);
  const again = await guest.request.get("/sitemap.xml");
  expect(await again.text()).toContain(`/ar/products/${slug}`);
  expect(await again.text()).toContain(`/en/products/${slug}`);
  await visitor.close();
});

test("demoEmbeddable=false يعرض زر النافذة الجديدة بدل الـ iframe", async ({
  page,
  context,
}) => {
  await loginAs(context, "ADMIN");
  const { rows } = await pool.query(
    `SELECT id FROM "Product" WHERE slug = $1`,
    [slug],
  );
  await page.goto(`/en/admin/products/${rows[0].id}`);
  await page
    .getByLabel("The demo app allows embedding in a frame (iframe)")
    .uncheck();
  await save(page);

  await page.goto(`/en/products/${slug}`);
  const link = page.getByRole("link", { name: "Open the demo in a new tab" });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("href", "https://example.com/demo");
  await expect(
    page.getByRole("button", { name: "Start the demo" }),
  ).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("ميزتان تُعاد ترتيبهما وتُحفظان بالترتيب الجديد", async ({
  page,
  context,
}) => {
  await loginAs(context, "ADMIN");
  const { rows } = await pool.query(
    `SELECT id FROM "Product" WHERE slug = $1`,
    [slug],
  );
  await page.goto(`/en/admin/products/${rows[0].id}`);
  for (const title of ["الأولى", "الثانية"]) {
    await page.getByRole("button", { name: "Add feature" }).click();
    await page.getByLabel("Title (العربية)").last().fill(title);
  }
  await save(page);
  await page.reload();
  await page.getByRole("button", { name: "Move down" }).first().click();
  await save(page);

  await page.goto(`/ar/products/${slug}`);
  const titles = await page
    .locator("#features-title + ul h3")
    .allTextContents();
  expect(titles).toEqual(["الثانية", "الأولى"]);
});

test("حفظ slug مكرر يُرفض برسالة واضحة", async ({ page, context }) => {
  await loginAs(context, "ADMIN");
  await page.goto("/en/admin/products/new");
  await page.getByLabel("URL slug").fill("restaurant-saas");
  await page.getByLabel("Cover", { exact: true }).fill("/seed/saas-cover.png");
  await fillArabicAndEnglish(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("This slug is already in use.")).toBeVisible();
});

test("التحقق: حقول مطلوبة وروابط غير آمنة تُرفض في النموذج", async ({
  page,
  context,
}) => {
  await loginAs(context, "ADMIN");
  await page.goto("/en/admin/products/new");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Fix the highlighted fields.")).toBeVisible();
  await page.getByLabel("URL slug").fill("bad-link");
  await page.getByLabel("Cover", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("Invalid URL (https, or a path starting with /)."),
  ).toBeVisible();
});

test("مستخدم عادي لا يرى صفحات إدارة المنتجات", async ({ page, context }) => {
  await loginAs(context, "USER");
  for (const path of [
    "/en/admin/products",
    "/en/admin/products/new",
    "/en/admin/categories",
  ]) {
    expect((await page.goto(path))?.status()).toBe(404);
  }
});

test("المدير ينشئ تصنيفاً فيظهر في فلتر التطبيقات ويُحذف", async ({
  page,
  context,
}) => {
  await loginAs(context, "ADMIN");
  const catSlug = `e2e-cat-${Date.now()}`;
  await page.goto("/en/admin/categories");
  await page.getByLabel("URL slug").fill(catSlug);
  await page.getByLabel("Name (العربية)").fill("تصنيف اختبار");
  await page.getByLabel("Name (English)").fill("E2E Category");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("cell", { name: /E2E Category/ })).toBeVisible();

  await page.goto("/en/products");
  await expect(
    page.locator("#f-category option", { hasText: "E2E Category" }),
  ).toHaveCount(1);

  await page.goto("/en/admin/categories");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("row", { name: /E2E Category/ })
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByRole("cell", { name: /E2E Category/ })).toHaveCount(0);
});
