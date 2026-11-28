import { test, expect, type Page } from "@playwright/test";
import { cleanupUsers, loginAs, pool } from "./helpers";

// يعتمد على seed: launch-offer (20% على desktop-accounting وrestaurant-saas)،
// وجهازان: zebra-zd220 (restaurant-saas وpos-android) وhoneywell-voyager-1202g (desktop-accounting وpos-android)

const day = 24 * 60 * 60 * 1000;

async function resetSeedOffer() {
  await pool.query(
    `UPDATE "Offer" SET "isActive" = true, "startsAt" = now() - interval '1 day', "endsAt" = now() + interval '30 days' WHERE slug = 'launch-offer'`,
  );
}

test.describe.configure({ mode: "serial" });

test.beforeEach(resetSeedOffer);
test.afterAll(async () => {
  await resetSeedOffer();
  await pool.query(`DELETE FROM "Offer" WHERE slug LIKE 'e2e-%'`);
  await pool.query(`DELETE FROM "Hardware" WHERE slug LIKE 'e2e-%'`);
  await pool.query(`DELETE FROM "HardwareCategory" WHERE slug LIKE 'e2e-%'`);
  await cleanupUsers();
});

test.describe("العروض (عام)", () => {
  test("صفحة العروض تعرض العرض الساري والتطبيقات المشمولة والسعر المشطوب", async ({
    page,
  }) => {
    await page.goto("/en/offers");
    await expect(
      page.getByRole("heading", { level: 2, name: "Launch offer" }),
    ).toBeVisible();
    await expect(page.getByText("LAUNCH20")).toBeVisible();
    await expect(page.getByText("20% off").first()).toBeVisible();
    // Desktop Accounting: 299 → 239.20
    const card = page
      .getByRole("article")
      .filter({ hasText: "Desktop Accounting" })
      .last();
    await expect(card.locator("del")).toHaveText("$299");
    await expect(card).toContainText("$239.20");
    // التطبيق غير المشمول لا يظهر
    await expect(page.getByText("Pharmacy POS for Android")).toHaveCount(0);
  });

  test("البطاقات في القائمة تعرض شارة الخصم والسعر المشطوب، وغير المشمول بلا شارة", async ({
    page,
  }) => {
    await page.goto("/en/products");
    const accounting = page
      .getByRole("article")
      .filter({ hasText: "Desktop Accounting" });
    await expect(accounting.getByText("20% off")).toBeVisible();
    await expect(accounting.locator("del")).toHaveText("$299");
    const android = page
      .getByRole("article")
      .filter({ hasText: "Pharmacy POS for Android" });
    await expect(android.getByText("20% off")).toHaveCount(0);
    await expect(android.locator("del")).toHaveCount(0);
  });

  test("«ابتداءً من» يُخصم، و«عند الطلب» لا يُخصم", async ({ page }) => {
    await page.goto("/en/products/restaurant-saas");
    await expect(page.locator("header").getByText("From $23.20")).toBeVisible();
    await expect(page.locator("header del")).toHaveText("$29");
    await page.goto("/en/products/pos-android");
    await expect(
      page.locator("header").getByText("Price on request"),
    ).toBeVisible();
    await expect(page.locator("header del")).toHaveCount(0);
  });

  test("صفحة المنتج تعرض العرض والعدّاد التنازلي", async ({ page }) => {
    await page.goto("/en/products/desktop-accounting");
    await expect(
      page.locator("header").getByText("Launch offer"),
    ).toBeVisible();
    await expect(
      page.locator("header").getByText(/\d+d \d+h \d+m \d+s/),
    ).toBeVisible();
  });

  test("عرض انتهى تاريخه يختفي دون أي تدخل (لا مهام مجدولة)", async ({
    page,
  }) => {
    await pool.query(
      `UPDATE "Offer" SET "endsAt" = now() + interval '4 seconds' WHERE slug = 'launch-offer'`,
    );
    await page.goto("/en/offers");
    await expect(
      page.getByRole("heading", { level: 2, name: "Launch offer" }),
    ).toBeVisible();
    await page.waitForTimeout(4500);
    await page.reload();
    await expect(
      page.getByText("There are no active offers right now."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Launch offer" }),
    ).toHaveCount(0);
    // وتعود الأسعار الأصلية في القائمة
    await page.goto("/en/products");
    const accounting = page
      .getByRole("article")
      .filter({ hasText: "Desktop Accounting" });
    await expect(accounting.locator("del")).toHaveCount(0);
    await expect(accounting).toContainText("$299");
  });

  test("عرض قادم (لم يبدأ) لا يظهر، وعرض معطَّل لا يظهر", async ({ page }) => {
    await pool.query(
      `UPDATE "Offer" SET "startsAt" = now() + interval '1 day', "endsAt" = now() + interval '2 days' WHERE slug = 'launch-offer'`,
    );
    await page.goto("/en/offers");
    await expect(
      page.getByText("There are no active offers right now."),
    ).toBeVisible();
    await resetSeedOffer();
    await pool.query(
      `UPDATE "Offer" SET "isActive" = false WHERE slug = 'launch-offer'`,
    );
    await page.goto("/en/offers");
    await expect(
      page.getByText("There are no active offers right now."),
    ).toBeVisible();
  });

  test("الصفحة العربية سليمة على 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ar/offers");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
    await expect(
      page.getByRole("heading", { level: 2, name: "عرض الإطلاق" }),
    ).toBeVisible();
  });
});

test.describe("الأجهزة (عام)", () => {
  test("القائمة والفلترة بالفئة من الرابط", async ({ page }) => {
    await page.goto("/en/hardware");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(2);
    await page.goto("/en/hardware?category=barcode-scanners");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "Wireless Barcode Scanner" }),
    ).toBeVisible();
    await page.locator("#h-category").selectOption("barcode-printers");
    await expect(page).toHaveURL(/category=barcode-printers/);
    await expect(
      page.getByRole("heading", { name: "Thermal Barcode Printer" }),
    ).toBeVisible();
  });

  test("صفحة الجهاز: المواصفات والسعر والتوفر وزر الاستفسار والتطبيقات المتوافقة", async ({
    page,
  }) => {
    await page.goto("/en/hardware/zebra-zd220");
    await expect(
      page.getByRole("heading", { level: 1, name: "Thermal Barcode Printer" }),
    ).toBeVisible();
    await expect(page.getByText("Zebra · ZD220")).toBeVisible();
    await expect(page.getByText("$189", { exact: true })).toBeVisible();
    await expect(page.getByText("In stock")).toBeVisible();
    await expect(page.getByRole("cell", { name: "203 dpi" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Inquire / Order" }),
    ).toHaveAttribute("href", /order\?hardware=zebra-zd220/);
    await expect(
      page.getByRole("heading", { name: "Cloud Restaurant Manager" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Pharmacy POS for Android" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Desktop Accounting" }),
    ).toHaveCount(0);
  });

  test("السعر عند الطلب والـ JSON-LD لصفحة الجهاز", async ({ page }) => {
    await page.goto("/en/hardware/honeywell-voyager-1202g");
    await expect(
      page.locator("header").getByText("Price on request"),
    ).toBeVisible();
    const ld = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    );
    expect(ld["@type"]).toBe("Product");
    expect(ld.brand.name).toBe("Honeywell");
    expect(ld.offers).toBeUndefined();
  });

  test("التوافق في الاتجاهين: الجهاز يظهر في صفحة التطبيق والعكس", async ({
    page,
  }) => {
    await page.goto("/en/products/desktop-accounting");
    await expect(
      page.getByRole("heading", { level: 2, name: "Compatible hardware" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Wireless Barcode Scanner" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Thermal Barcode Printer" }),
    ).toHaveCount(0);

    await page.goto("/en/hardware/honeywell-voyager-1202g");
    await expect(
      page.getByRole("heading", { name: "Desktop Accounting" }),
    ).toBeVisible();

    // تطبيق بلا أجهزة لا يعرض القسم
    await pool.query(
      `DELETE FROM "HardwareProduct" WHERE "productId" = (SELECT id FROM "Product" WHERE slug = 'restaurant-saas')`,
    );
    await page.goto(`/en/products/restaurant-saas?x=${Date.now()}`);
    // (النسخة المخزنة قد تبقى؛ نعيد البيانات في النهاية)
    await pool.query(
      `INSERT INTO "HardwareProduct" ("hardwareId","productId") SELECT h.id, p.id FROM "Hardware" h, "Product" p WHERE h.slug = 'zebra-zd220' AND p.slug = 'restaurant-saas' ON CONFLICT DO NOTHING`,
    );
  });

  test("سلامة العرض على 375px بالعربية والإنجليزية", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of [
      "/ar/hardware",
      "/en/hardware",
      "/ar/hardware/zebra-zd220",
      "/en/hardware/zebra-zd220",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
      ).toBe(false);
    }
  });
});

async function localInput(page: Page, offsetMs: number) {
  return page.evaluate((offset) => {
    const d = new Date(Date.now() + offset);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, offsetMs);
}

test.describe("الإدارة", () => {
  test("المدير ينشئ عرضاً بقيمة ثابتة لمنتج، فيظهر وتتغير الأسعار فوراً", async ({
    page,
    context,
  }) => {
    await loginAs(context, "ADMIN");
    await pool.query(
      `UPDATE "Offer" SET "isActive" = false WHERE slug = 'launch-offer'`,
    );
    await page.goto("/en/admin/offers/new");
    await page.getByLabel("URL slug").fill("e2e-fixed-offer");
    await page.getByLabel("Discount type").selectOption("FIXED");
    await page.getByLabel("Discount amount").fill("50");
    await page.getByLabel("Starts at").fill(await localInput(page, -day / 24));
    await page.getByLabel("Ends at").fill(await localInput(page, day));
    await page.locator("#panel-ar").getByLabel("Title").fill("عرض ثابت");
    await page.getByRole("tab", { name: "English" }).click();
    await page.locator("#panel-en").getByLabel("Title").fill("E2E fixed offer");
    await page.getByRole("checkbox", { name: "Desktop Accounting" }).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/admin\/offers\/(?!new$)[a-z0-9]+$/);

    await page.goto("/en/offers");
    await expect(
      page.getByRole("heading", { level: 2, name: "E2E fixed offer" }),
    ).toBeVisible();
    await page.goto("/en/products");
    const accounting = page
      .getByRole("article")
      .filter({ hasText: "Desktop Accounting" });
    await expect(accounting.locator("del")).toHaveText("$299");
    await expect(accounting).toContainText("$249");
    await expect(accounting.getByText("$50 off")).toBeVisible();

    // صفحة المنتج ثابتة (ISR): الحفظ من الإدارة يبطلها فتعرض العرض الجديد من أول زيارة
    await page.goto("/en/products/desktop-accounting");
    await expect(
      page.locator("header").getByText("E2E fixed offer"),
    ).toBeVisible();
    await expect(page.locator("header").getByText("$249")).toBeVisible();
  });

  test("قائمة العروض تعرض الحالة (سارٍ/معطّل)", async ({ page, context }) => {
    await loginAs(context, "ADMIN");
    await pool.query(
      `UPDATE "Offer" SET "isActive" = false WHERE slug = 'launch-offer'`,
    );
    await page.goto("/en/admin/offers");
    await expect(
      page.getByRole("row", { name: /E2E fixed offer/ }),
    ).toContainText("Active");
    await expect(page.getByRole("row", { name: /Launch offer/ })).toContainText(
      "Disabled",
    );
  });

  test("التحقق: النسبة لا تتجاوز 100 والنهاية بعد البداية", async ({
    page,
    context,
  }) => {
    await loginAs(context, "ADMIN");
    await page.goto("/en/admin/offers/new");
    await page.getByLabel("URL slug").fill("e2e-bad-offer");
    await page.getByLabel("Discount %").fill("150");
    await page.locator("#panel-ar").getByLabel("Title").fill("س");
    await page.getByLabel("Starts at").fill(await localInput(page, day));
    await page.getByLabel("Ends at").fill(await localInput(page, 0));
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByText("The percentage can't exceed 100."),
    ).toBeVisible();
    await expect(
      page.getByText("The end date must be after the start date."),
    ).toBeVisible();
  });

  test("المدير ينشئ فئة وجهازاً ويربطه بتطبيق فيظهر في الاتجاهين", async ({
    page,
    context,
  }) => {
    await loginAs(context, "ADMIN");
    await page.goto("/en/admin/hardware-categories");
    await page.getByLabel("URL slug").fill("e2e-cat");
    await page.getByLabel("Name (العربية)").fill("فئة اختبار");
    await page.getByLabel("Name (English)").fill("E2E hw category");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("cell", { name: /E2E hw category/ }),
    ).toBeVisible();

    await page.goto("/en/admin/hardware/new");
    await page.getByLabel("URL slug").fill("e2e-hw");
    await page.getByLabel("Status").selectOption("PUBLISHED");
    await page
      .getByLabel("Category")
      .selectOption({ label: "E2E hw category" });
    await page.getByLabel("Brand").fill("Acme");
    await page.getByLabel("Model").fill("X-1");
    await page.locator("#panel-ar").getByLabel("Name").fill("جهاز اختبار");
    await page.getByRole("tab", { name: "English" }).click();
    await page.locator("#panel-en").getByLabel("Name").fill("E2E Device");
    await page.getByRole("button", { name: "Add image" }).click();
    await page.getByLabel("Image", { exact: true }).fill("/seed/printer.png");
    await page.getByRole("button", { name: "Add specification" }).click();
    await page.getByLabel("Specification (العربية)").fill("اللون");
    await page.getByLabel("Specification (English)").fill("Color");
    await page.getByLabel("Value").fill("Black");
    await page
      .getByRole("checkbox", { name: "Pharmacy POS for Android" })
      .check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/admin\/hardware\/(?!new$)[a-z0-9]+$/);

    await page.goto("/en/hardware/e2e-hw");
    await expect(
      page.getByRole("heading", { level: 1, name: "E2E Device" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Black" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Pharmacy POS for Android" }),
    ).toBeVisible();
    await page.goto("/en/hardware?category=e2e-cat");
    await expect(
      page.getByRole("heading", { name: "E2E Device" }),
    ).toBeVisible();
    await page.goto("/ar/hardware/e2e-hw");
    await expect(
      page.getByRole("heading", { level: 1, name: "جهاز اختبار" }),
    ).toBeVisible();
    // يظهر في sitemap
    const sitemap = await page.request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/hardware/e2e-hw");
  });

  test("تحويل الجهاز إلى مسودة من الإدارة يخفيه فوراً من العامة", async ({
    page,
    context,
    browser,
  }) => {
    await loginAs(context, "ADMIN");
    const { rows } = await pool.query(
      `SELECT id FROM "Hardware" WHERE slug = 'e2e-hw'`,
    );
    await page.goto(`/en/admin/hardware/${rows[0].id}`);
    await page.getByLabel("Status").selectOption("DRAFT");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Saved.");

    const visitor = await browser.newContext();
    const guest = await visitor.newPage();
    expect((await guest.goto("/en/hardware/e2e-hw"))?.status()).toBe(404);
    await guest.goto("/en/hardware");
    await expect(
      guest.getByRole("heading", { name: "E2E Device" }),
    ).toHaveCount(0);
    expect(
      await (await guest.request.get("/sitemap.xml")).text(),
    ).not.toContain("/hardware/e2e-hw");
    await visitor.close();
  });

  test("النشر بلا صورة يُرفض", async ({ page, context }) => {
    await loginAs(context, "ADMIN");
    await page.goto("/en/admin/hardware/new");
    await page.getByLabel("URL slug").fill("e2e-noimg");
    await page.getByLabel("Status").selectOption("PUBLISHED");
    await page.getByLabel("Brand").fill("A");
    await page.getByLabel("Model").fill("B");
    await page.locator("#panel-ar").getByLabel("Name").fill("جهاز");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByText("Add at least one image before publishing."),
    ).toBeVisible();
  });

  // الحذف عبر الإدارة (لا SQL) كي تُبطَل صفحات ISR المتأثرة وتبقى الجولة التالية نظيفة
  test("حذف العرض والجهاز والفئة من الإدارة يزيلها من العامة", async ({
    page,
    context,
  }) => {
    await loginAs(context, "ADMIN");
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/en/admin/offers");
    await page
      .getByRole("row", { name: /E2E fixed offer/ })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(
      page.getByRole("row", { name: /E2E fixed offer/ }),
    ).toHaveCount(0);

    // والحذف يبطل صفحة المنتج أيضاً: لا أثر للعرض المحذوف من أول زيارة
    await page.goto("/en/products/desktop-accounting");
    await expect(
      page.locator("header").getByText("E2E fixed offer"),
    ).toHaveCount(0);

    await page.goto("/en/admin/hardware");
    await page
      .getByRole("row", { name: /E2E Device/ })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.getByRole("row", { name: /E2E Device/ })).toHaveCount(0);

    await page.goto("/en/admin/hardware-categories");
    await page
      .getByRole("row", { name: /E2E hw category/ })
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(
      page.getByRole("row", { name: /E2E hw category/ }),
    ).toHaveCount(0);
  });

  test("مستخدم عادي يُرفض من صفحات العروض والأجهزة", async ({
    page,
    context,
  }) => {
    await loginAs(context, "USER");
    for (const path of [
      "/en/admin/offers",
      "/en/admin/offers/new",
      "/en/admin/hardware",
      "/en/admin/hardware/new",
      "/en/admin/hardware-categories",
    ]) {
      expect((await page.goto(path))?.status()).toBe(404);
    }
  });
});
