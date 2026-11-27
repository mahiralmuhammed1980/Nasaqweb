import { test, expect } from "@playwright/test";

test("/ar يعرض rtl و/en يعرض ltr", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("المبدّل يحافظ على الصفحة الحالية", async ({ page }) => {
  await page.goto("/ar/nonexistent?x=1");
  await expect(page.getByRole("link", { name: /English/ })).toHaveAttribute(
    "href",
    /\/en\/nonexistent\?x=1/,
  );
});
