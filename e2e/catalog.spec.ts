import { test, expect } from "@playwright/test";

// يعتمد على بيانات seed: restaurant-saas (SaaS) وdesktop-accounting (EXE) وpos-android (APK)

test.describe("الفلاتر", () => {
  test("تنعكس في الرابط وتعمل عند فتحه مباشرة", async ({ page }) => {
    await page.goto("/ar/products?type=APK");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", { name: "نقطة بيع الصيدلية للجوال" }),
    ).toBeVisible();
    await expect(page.locator("#f-type")).toHaveValue("APK");
  });

  test("تغيير الفلتر يحدّث الرابط", async ({ page }) => {
    await page.goto("/en/products");
    await page.locator("#f-type").selectOption("SAAS");
    await expect(page).toHaveURL(/type=SAAS/);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await page.locator("#f-sort").selectOption("price_asc");
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test("البحث بالاسم وبالتصنيف والترتيب بالسعر من الرابط", async ({ page }) => {
    await page.goto("/en/products?q=kitchen");
    await expect(
      page.getByRole("heading", { name: "Cloud Restaurant Manager" }),
    ).toBeVisible();
    await page.goto("/en/products?category=accounting");
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(1);
    await page.goto("/en/products?sort=price_desc");
    await expect(page.getByRole("heading", { level: 3 }).first()).toHaveText(
      "Desktop Accounting",
    );
  });

  test("قيم غير صالحة في الرابط لا تكسر الصفحة", async ({ page }) => {
    const response = await page.goto("/ar/products?type=HACK&sort=zzz");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);
  });
});

test.describe("المعاينة الحية (SaaS)", () => {
  test("لا يُحمَّل الـ iframe قبل النقر وأوضاع الأجهزة الثلاثة تعمل", async ({
    page,
  }) => {
    await page.goto("/ar/products/restaurant-saas");
    await expect(page.locator("iframe")).toHaveCount(0);

    const frameBox = page.getByTitle("معاينة حية للتطبيق");
    await expect(frameBox).toHaveCount(0);

    await page.getByRole("button", { name: "ابدأ التجربة" }).click();
    await expect(page.locator("iframe")).toHaveCount(1);
    const iframe = page.locator("iframe");
    await expect(iframe).toHaveAttribute("src", "https://example.com/");
    await expect(iframe).toHaveAttribute("sandbox", /allow-scripts/);

    const widthOf = async () => (await iframe.boundingBox())?.width ?? 0;
    await page.getByRole("button", { name: "جوال" }).click();
    expect(await widthOf()).toBeLessThanOrEqual(376);
    await page.getByRole("button", { name: "تابلت" }).click();
    const tablet = await widthOf();
    expect(tablet).toBeGreaterThan(376);
    expect(tablet).toBeLessThanOrEqual(769);
    await page.getByRole("button", { name: "سطح المكتب" }).click();
    expect(await widthOf()).toBeGreaterThan(tablet);
    await expect(
      page.getByRole("button", { name: "سطح المكتب" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("بيانات الدخول التجريبية ظاهرة مع ملاحظة", async ({ page }) => {
    await page.goto("/ar/products/restaurant-saas");
    await expect(page.getByText("demo@example.com")).toBeVisible();
    await expect(
      page.getByText("هذه نسخة تجريبية تُعاد بياناتها دورياً."),
    ).toBeVisible();
  });
});

test.describe("EXE / APK", () => {
  test("الفيديو لا يُحمَّل قبل النقر", async ({ page }) => {
    await page.goto("/en/products/desktop-accounting");
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: /Play video/ }).click();
    await expect(page.locator("iframe")).toHaveCount(1);
    await expect(page.locator("iframe")).toHaveAttribute(
      "src",
      /youtube-nocookie\.com\/embed\/M7lc1UVf-VE/,
    );
  });

  test("الـ lightbox يعمل بلوحة المفاتيح (RTL: السهم الأيسر = التالي)", async ({
    page,
  }) => {
    await page.goto("/ar/products/desktop-accounting");
    const dialog = page.getByRole("dialog", { name: "معرض اللقطات" });
    await expect(dialog).toBeHidden();
    await page
      .getByRole("button", { name: /فتح اللقطة/ })
      .first()
      .click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("1 من 3")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText("2 من 3")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText("1 من 3")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("الـ lightbox في LTR: السهم الأيمن = التالي", async ({ page }) => {
    await page.goto("/en/products/pos-android");
    await page
      .getByRole("button", { name: /Open screenshot/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: "Screenshot gallery" });
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText("2 of 3")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("زر تحميل النسخة التجريبية ظاهر", async ({ page }) => {
    await page.goto("/en/products/pos-android");
    await expect(
      page.getByRole("link", { name: "Download trial" }),
    ).toBeVisible();
  });
});

test.describe("سلامة العرض", () => {
  for (const locale of ["ar", "en"]) {
    for (const path of [
      "",
      "/products",
      "/products/restaurant-saas",
      "/products/desktop-accounting",
    ]) {
      test(`${locale}${path || "/"} على عرض 375px بلا تمرير أفقي`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(`/${locale}${path}`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow).toBe(false);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );
      });
    }
  }

  test("JSON-LD وcanonical وhreflang لصفحة المنتج", async ({ page }) => {
    await page.goto("/en/products/desktop-accounting");
    const ld = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    );
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.operatingSystem).toBe("Windows 10+");
    expect(ld.offers.price).toBe("299");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/en\/products\/desktop-accounting$/,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="ar"]'),
    ).toHaveAttribute("href", /\/ar\/products\/desktop-accounting$/);
  });

  test("منتج غير موجود يعيد 404", async ({ page }) => {
    const response = await page.goto("/ar/products/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
