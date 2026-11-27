import { test, expect, type Browser, type Page } from "@playwright/test";
import { createUnsubscribeToken } from "../src/lib/unsubscribe-token";
import {
  cleanupUsers,
  loginAs,
  pool,
  resetConsentRecords,
  visitorContext,
} from "./helpers";

test.describe.configure({ mode: "serial" });

const PREFIX = "E2E";

test.beforeAll(resetConsentRecords);
test.afterAll(async () => {
  await pool.query(`DELETE FROM "OrderRequest" WHERE name LIKE '${PREFIX}%'`);
  await pool.query(`DELETE FROM "ContactMessage" WHERE name LIKE '${PREFIX}%'`);
  await resetConsentRecords();
  await cleanupUsers();
});

async function orderNumber(page: Page): Promise<number> {
  const text = await page.getByTestId("order-number").textContent();
  return Number(text);
}

test.describe("الطلب (زائر)", () => {
  test("زائر يطلب منتجاً بخطة، فيظهر في CRM بالخطة والعرض الساري ويُرسل البريدان", async ({
    browser,
  }) => {
    await pool.query(
      `UPDATE "Offer" SET "isActive" = true, "startsAt" = now() - interval '1 day', "endsAt" = now() + interval '30 days' WHERE slug = 'launch-offer'`,
    );
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/en/products/restaurant-saas");
    await page.getByRole("link", { name: "Order now" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Order now" });
    await expect(dialog).toBeVisible();

    await dialog
      .getByLabel("Plan")
      .selectOption({ label: "Professional — $59 per month" });
    await dialog.getByLabel("Name").fill(`${PREFIX} Plan Buyer`);
    await dialog.getByLabel("Phone number").fill("+962 79 111 2233");
    await dialog
      .getByRole("textbox", { name: "Email" })
      .fill("plan.buyer@example.test");
    await dialog.getByRole("button", { name: "Send request" }).click();

    await expect(page.getByText("We received your request")).toBeVisible();
    const number = await orderNumber(page);
    expect(number).toBeGreaterThanOrEqual(1001);
    await visitor.close();

    // يظهر في CRM بالخطة والعرض الساري الصحيحين
    const admin = await browser.newContext();
    await loginAs(admin, "ADMIN");
    const adminPage = await admin.newPage();
    await adminPage.goto(`/en/admin/orders?q=${number}`);
    await adminPage.getByRole("link", { name: `#${number}` }).click();
    await expect(
      adminPage.getByRole("heading", { name: `Order #${number}` }),
    ).toBeVisible();
    const details = adminPage.locator("dl");
    await expect(details).toContainText("Cloud Restaurant Manager");
    await expect(details).toContainText("Professional");
    await expect(details).toContainText("Launch offer");
    await expect(details).toContainText("+962791112233");

    // البريدان أُرسلا (محاكاة) وسُجّلا في الخط الزمني
    const timeline = adminPage
      .getByRole("list")
      .filter({ has: adminPage.locator("[data-activity]") });
    await expect(timeline).toContainText("Email sent (Admin notification)");
    await expect(timeline).toContainText("Email sent (Customer confirmation)");
    await admin.close();
  });

  test("تُرسل البيانات الصحيحة: الهاتف دولي، ولا موافقة تسويقية بلا تحديد الخانة", async ({
    browser,
  }) => {
    const { rows } = await pool.query(
      `SELECT phone, "preferredChannel", "phoneHasWhatsapp", locale, "ipHash", "productId", "offerId", "planId" FROM "OrderRequest" WHERE name = $1`,
      [`${PREFIX} Plan Buyer`],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].phone).toBe("+962791112233");
    expect(rows[0].preferredChannel).toBe("WHATSAPP");
    expect(rows[0].locale).toBe("en");
    expect(rows[0].ipHash).toMatch(/^[0-9a-f]{64}$/); // IP لا يُخزَّن خاماً
    expect(rows[0].offerId).not.toBeNull();
    expect(rows[0].planId).not.toBeNull();
    const consent = await pool.query(
      'SELECT count(*)::int AS n FROM "ConsentRecord"',
    );
    expect(consent.rows[0].n).toBe(0);
    void browser;
  });

  test("الموافقة التسويقية: خانة غير محددة مسبقاً، وعند تحديدها سجل لكل قناة بنص الموافقة", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/en/products/desktop-accounting");
    await page.getByRole("link", { name: "Order now" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Order now" });
    const consent = dialog.getByRole("checkbox", {
      name: /I agree to receive offers/,
    });
    await expect(consent).not.toBeChecked();

    await dialog.getByLabel("Name").fill(`${PREFIX} Consenter`);
    await dialog.getByLabel("Phone number").fill("+962 79 555 0001");
    await dialog
      .getByRole("checkbox", { name: "This number has WhatsApp" })
      .check();
    await dialog
      .getByRole("textbox", { name: "Email" })
      .fill("consenter@example.test");
    await consent.check();
    await dialog.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("We received your request")).toBeVisible();
    await visitor.close();

    const { rows } = await pool.query(
      `SELECT channel, granted, source, "policyVersion", "consentText", email, phone, "ipHash" FROM "ConsentRecord" ORDER BY channel`,
    );
    expect(rows.map((r) => r.channel)).toEqual(["EMAIL", "WHATSAPP"]);
    for (const row of rows) {
      expect(row.granted).toBe(true);
      expect(row.source).toBe("ORDER_FORM");
      expect(row.policyVersion).toBe(1);
      expect(row.consentText).toContain("I agree to receive offers");
      expect(row.email).toBe("consenter@example.test");
      expect(row.phone).toBe("+962795550001");
      expect(row.ipHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("الموافقة التسويقية بلا بريد ولا واتساب تُرفض برسالة", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.goto("/en/order?product=desktop-accounting");
    await page.getByLabel("Name").fill(`${PREFIX} NoChannel`);
    await page.getByLabel("Phone number").fill("+962 79 555 0002");
    await page
      .getByRole("checkbox", { name: /I agree to receive offers/ })
      .check();
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByText(
        "To enable consent, enter your email or confirm your number has WhatsApp.",
      ),
    ).toBeVisible();
    const { rows } = await pool.query(
      `SELECT 1 FROM "OrderRequest" WHERE name = $1`,
      [`${PREFIX} NoChannel`],
    );
    expect(rows).toHaveLength(0);
    await visitor.close();
  });

  test("التحقق: هاتف بلا رمز دولة، ثم بريد مفقود لقناة البريد", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.goto("/en/order?product=desktop-accounting");
    await page.getByLabel("Name").fill(`${PREFIX} Invalid`);
    await page.getByLabel("Phone number").fill("0791234567");
    await page.getByRole("radio", { name: "Email" }).check();
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText(/Enter an international number/)).toBeVisible();

    // بعد تصحيح الهاتف تظهر قاعدة «البريد إلزامي لقناة البريد»
    await page.getByLabel("Phone number").fill("+962 79 123 4567");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByText(
        "Email is required because you chose to be contacted by email.",
      ),
    ).toBeVisible();
    const { rows } = await pool.query(
      `SELECT 1 FROM "OrderRequest" WHERE name = $1`,
      [`${PREFIX} Invalid`],
    );
    expect(rows).toHaveLength(0);
    await visitor.close();
  });

  test("طلب جهاز من صفحته", async ({ browser }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/en/hardware/zebra-zd220");
    await page.getByRole("link", { name: "Inquire / Order" }).click();
    const dialog = page.getByRole("dialog", { name: "Order now" });
    await expect(dialog).toContainText("Thermal Barcode Printer");
    await dialog.getByLabel("Name").fill(`${PREFIX} Hardware Buyer`);
    await dialog.getByLabel("Phone number").fill("+962 79 777 8899");
    await dialog.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("We received your request")).toBeVisible();
    await visitor.close();
    const { rows } = await pool.query(
      `SELECT "hardwareId", "productId" FROM "OrderRequest" WHERE name = $1`,
      [`${PREFIX} Hardware Buyer`],
    );
    expect(rows[0].hardwareId).not.toBeNull();
    expect(rows[0].productId).toBeNull();
  });

  test("على الجوال زر الطلب يفتح صفحة كاملة (لا نافذة)", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ar/products/restaurant-saas");
    await page.getByRole("link", { name: "اطلب الآن" }).last().click();
    await expect(page).toHaveURL(/\/ar\/order\?product=restaurant-saas/);
    await expect(
      page.getByRole("heading", { level: 1, name: "اطلب الآن" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
    await visitor.close();
  });

  test("الطلب السادس من نفس IP خلال ساعة يُرفض برسالة واضحة", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser, "203.0.113.77");
    const page = await visitor.newPage();
    for (let i = 1; i <= 5; i++) {
      await page.goto("/en/order?product=desktop-accounting");
      await page.getByLabel("Name").fill(`${PREFIX} Burst ${i}`);
      await page.getByLabel("Phone number").fill("+962 79 000 0000");
      await page.getByRole("button", { name: "Send request" }).click();
      await expect(page.getByText("We received your request")).toBeVisible();
    }
    await page.goto("/en/order?product=desktop-accounting");
    await page.getByLabel("Name").fill(`${PREFIX} Burst 6`);
    await page.getByLabel("Phone number").fill("+962 79 000 0000");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /too many requests/i }),
    ).toBeVisible();
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM "OrderRequest" WHERE name LIKE '${PREFIX} Burst%'`,
    );
    expect(rows[0].n).toBe(5);
    // IP آخر لا يتأثر
    const other = await visitorContext(browser, "203.0.113.78");
    const otherPage = await other.newPage();
    await otherPage.goto("/en/order?product=desktop-accounting");
    await otherPage.getByLabel("Name").fill(`${PREFIX} Other IP`);
    await otherPage.getByLabel("Phone number").fill("+962 79 000 0001");
    await otherPage.getByRole("button", { name: "Send request" }).click();
    await expect(otherPage.getByText("We received your request")).toBeVisible();
    await visitor.close();
    await other.close();
  });

  test("فشل الإرسال (Resend) لا يمنع حفظ الطلب ويُسجَّل في الخط الزمني", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.goto("/en/order?product=desktop-accounting");
    await page.getByLabel("Name").fill(`${PREFIX} Mail Fails`);
    await page.getByLabel("Phone number").fill("+962 79 123 0000");
    await page.getByRole("textbox", { name: "Email" }).fill("fail@resend.test");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByText("We received your request")).toBeVisible();
    const number = await orderNumber(page);
    await visitor.close();

    const { rows } = await pool.query(
      `SELECT a.payload FROM "RequestActivity" a JOIN "OrderRequest" o ON o.id = a."requestId" WHERE o.number = $1 AND a.type = 'EMAIL_SENT' ORDER BY a."createdAt"`,
      [number],
    );
    const byKind = Object.fromEntries(
      rows.map((r) => [r.payload.kind, r.payload]),
    );
    expect(byKind.ADMIN_NEW_ORDER.status).toBe("SENT");
    expect(byKind.CUSTOMER_CONFIRMATION.status).toBe("FAILED");

    const admin = await browser.newContext();
    await loginAs(admin, "ADMIN");
    const adminPage = await admin.newPage();
    await adminPage.goto(`/en/admin/orders?q=${number}`);
    await adminPage.getByRole("link", { name: `#${number}` }).click();
    await expect(
      adminPage.getByText(/Email failed \(Customer confirmation\)/),
    ).toBeVisible();
    await admin.close();
  });
});

async function adminOn(browser: Browser) {
  const context = await browser.newContext();
  await loginAs(context, "ADMIN");
  return { context, page: await context.newPage() };
}

test.describe("CRM", () => {
  let orderId = "";
  let number = 0;

  test("تغيير الحالة وإضافة ملاحظة والردّ بالبريد تظهر كلها في الخط الزمني", async ({
    browser,
  }) => {
    const { rows } = await pool.query(
      `INSERT INTO "OrderRequest" (id, name, phone, email, "preferredChannel", locale, "ipHash", "productId", "updatedAt")
       VALUES ('e2e_crm_order', $1, '+962791230000', 'crm.customer@example.test', 'EMAIL', 'en', 'x', (SELECT id FROM "Product" WHERE slug = 'desktop-accounting'), now())
       RETURNING id, number`,
      [`${PREFIX} CRM`],
    );
    orderId = rows[0].id;
    number = rows[0].number;

    const { context, page } = await adminOn(browser);
    await page.goto(`/en/admin/orders/${orderId}`);

    await page.getByLabel("Status", { exact: true }).selectOption("CONTACTED");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.locator('[data-activity="STATUS_CHANGE"]')).toContainText(
      "Status changed from “New” to “Contacted”",
    );

    await page
      .getByLabel("Add an internal note")
      .fill("Called the customer, wants a quote");
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.locator('[data-activity="NOTE"]')).toContainText(
      "Called the customer, wants a quote",
    );

    await page.getByLabel("Subject").fill("Your quote");
    await page
      .getByLabel("Reply text")
      .fill("Here is the quote you asked for.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText("Reply sent.")).toBeVisible();
    await expect(
      page
        .locator('[data-activity="EMAIL_SENT"]')
        .filter({ hasText: "Admin reply" }),
    ).toContainText("Email sent (Admin reply): Your quote");

    // الترتيب الزمني: حالة ← ملاحظة ← بريد
    const kinds = await page
      .locator("[data-activity]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-activity")));
    expect(kinds).toEqual(["STATUS_CHANGE", "NOTE", "EMAIL_SENT"]);
    await context.close();
  });

  test("القائمة: فلترة بالحالة والبحث، وروابط الإجراءات السريعة", async ({
    browser,
  }) => {
    const { context, page } = await adminOn(browser);
    await page.goto("/en/admin/orders?status=CONTACTED");
    await expect(page.getByRole("link", { name: `#${number}` })).toBeVisible();
    await page.goto("/en/admin/orders?status=WON");
    await expect(page.getByRole("link", { name: `#${number}` })).toHaveCount(0);
    await page.goto(
      `/en/admin/orders?q=${encodeURIComponent(`${PREFIX} CRM`)}`,
    );
    await expect(page.getByRole("link", { name: `#${number}` })).toBeVisible();
    await page.goto(`/en/admin/orders?productId=nonexistent`);
    await expect(page.getByText("No matching orders.")).toBeVisible();

    await page.goto(`/en/admin/orders/${orderId}`);
    await expect(
      page.getByRole("link", { name: "Open WhatsApp" }),
    ).toHaveAttribute("href", /^https:\/\/wa\.me\/962791230000\?text=/);
    await expect(page.getByRole("link", { name: "Call" })).toHaveAttribute(
      "href",
      "tel:+962791230000",
    );
    await context.close();
  });

  test("تصدير CSV: للمدير فقط، ويحصّن الخلايا من حقن المعادلات", async ({
    browser,
  }) => {
    await pool.query(
      `INSERT INTO "OrderRequest" (id, name, phone, "preferredChannel", locale, "ipHash", "productId", "updatedAt")
       VALUES ('e2e_csv_order', $1, '+962791239999', 'PHONE', 'ar', 'x', (SELECT id FROM "Product" WHERE slug = 'desktop-accounting'), now())`,
      [`${PREFIX} =HYPERLINK("http://evil")`],
    );
    const { context, page } = await adminOn(browser);
    const response = await page.request.get("/en/admin/orders/export?q=E2E");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    const csv = await response.text();
    expect(csv.startsWith("﻿number,createdAt,status,name")).toBe(true);
    expect(csv).toContain(`${PREFIX} CRM`);
    // الخلية التي تبدأ بـ = (اسم الزبون) ليست هنا لأن الاسم يبدأ بـ E2E؛ نتحقق من قيمة تبدأ بـ = داخل الحقل نفسه
    expect(csv).toContain(`"E2E =HYPERLINK(""http://evil"")"`);
    await context.close();

    // مستخدم عادي: 403. زائر بلا جلسة: يُحوَّل للدخول.
    const user = await browser.newContext();
    await loginAs(user, "USER");
    expect((await user.request.get("/en/admin/orders/export")).status()).toBe(
      403,
    );
    await user.close();
    const guest = await browser.newContext();
    const anon = await guest.request.get("/en/admin/orders/export", {
      maxRedirects: 0,
    });
    expect([301, 302, 303, 307, 308]).toContain(anon.status());
    expect(anon.headers()["location"]).toMatch(/\/login/);
    await guest.close();
  });

  test("مستخدم عادي يُرفض من صفحات الطلبات والرسائل والإعدادات", async ({
    browser,
  }) => {
    const user = await browser.newContext();
    await loginAs(user, "USER");
    const page = await user.newPage();
    for (const path of [
      "/en/admin/orders",
      `/en/admin/orders/${orderId}`,
      "/en/admin/messages",
      "/en/admin/settings",
    ]) {
      expect((await page.goto(path))?.status()).toBe(404);
    }
    await user.close();
  });
});

test.describe("التواصل", () => {
  test("رسالة تواصل تُحفظ وتظهر في الإدارة وتُغيَّر حالتها", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.goto("/en/contact");
    await page.getByLabel("Name").fill(`${PREFIX} Contact`);
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("contact.sender@example.test");
    await page.getByLabel("Subject").fill("E2E subject");
    await page
      .getByLabel("Message")
      .fill("Hello, this is an end-to-end message.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("We got your message")).toBeVisible();
    await visitor.close();

    const { context, page: admin } = await adminOn(browser);
    await admin.goto("/en/admin/messages");
    await admin.getByRole("link", { name: "E2E subject" }).click();
    await expect(
      admin.getByText("Hello, this is an end-to-end message."),
    ).toBeVisible();
    await admin.getByRole("button", { name: "Handled" }).click();
    await expect(
      admin.getByRole("button", { name: "Handled" }),
    ).toHaveAttribute("aria-pressed", "true");
    await context.close();
  });

  test("التواصل: بريد أو هاتف مطلوب، والموافقة تتطلب بريداً", async ({
    browser,
  }) => {
    const visitor = await visitorContext(browser);
    const page = await visitor.newPage();
    await page.goto("/en/contact");
    await page.getByLabel("Name").fill(`${PREFIX} Contact2`);
    await page.getByLabel("Subject").fill("S");
    await page.getByLabel("Message").fill("Some message");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByText("Enter your email or phone so we can reply."),
    ).toBeVisible();
    await visitor.close();
  });
});

test.describe("إلغاء الاشتراك", () => {
  test("الرابط الموقّع يعمل دون تسجيل دخول ويضيف سجل granted=false", async ({
    browser,
  }) => {
    await resetConsentRecords();
    await pool.query(
      `INSERT INTO "ConsentRecord" (id, email, channel, granted, source, "policyVersion", "consentText") VALUES ('e2e_c1', 'unsub@example.test', 'EMAIL', true, 'ORDER_FORM', 1, 't')`,
    );
    const token = createUnsubscribeToken(
      { email: "unsub@example.test", channel: "EMAIL" },
      process.env.AUTH_SECRET,
    );
    const guest = await visitorContext(browser);
    const page = await guest.newPage();
    await page.goto(`/en/unsubscribe/${token}`);
    await page.getByRole("button", { name: "Confirm unsubscribe" }).click();
    await expect(page.getByTestId("unsubscribe-result")).toContainText(
      "You're unsubscribed",
    );

    const { rows } = await pool.query(
      `SELECT granted, source, email FROM "ConsentRecord" WHERE email = 'unsub@example.test' ORDER BY "createdAt"`,
    );
    expect(rows.map((r) => [r.granted, r.source])).toEqual([
      [true, "ORDER_FORM"],
      [false, "UNSUBSCRIBE"],
    ]);

    // مرة ثانية: لا سجل جديد
    await page.goto(`/en/unsubscribe/${token}`);
    await page.getByRole("button", { name: "Confirm unsubscribe" }).click();
    await expect(page.getByTestId("unsubscribe-result")).toContainText(
      "already unsubscribed",
    );
    const again = await pool.query(
      `SELECT count(*)::int AS n FROM "ConsentRecord" WHERE email = 'unsub@example.test'`,
    );
    expect(again.rows[0].n).toBe(2);
    await guest.close();
  });

  test("رابط مزوّر أو تالف يُرفض ولا يغيّر شيئاً", async ({ browser }) => {
    const guest = await visitorContext(browser);
    const page = await guest.newPage();
    const forged = createUnsubscribeToken(
      { email: "victim@example.test" },
      "wrong-secret",
    );
    for (const token of [forged, "garbage", "a.b"]) {
      await page.goto(`/en/unsubscribe/${token}`);
      await expect(
        page.getByText("This unsubscribe link is not valid."),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Confirm unsubscribe" }),
      ).toHaveCount(0);
    }
    await guest.close();
  });

  test("سجلات الموافقة للإضافة فقط: التعديل والحذف مرفوضان من قاعدة البيانات", async () => {
    await expect(
      pool.query(
        `UPDATE "ConsentRecord" SET granted = true WHERE id = 'e2e_c1'`,
      ),
    ).rejects.toThrow(/append-only/);
    await expect(
      pool.query(`DELETE FROM "ConsentRecord" WHERE id = 'e2e_c1'`),
    ).rejects.toThrow(/append-only/);
  });
});

test.describe("الإعدادات وواتساب", () => {
  test("رقم واتساب من الإعدادات يظهر الزر العائم برسالة تتضمن المنتج، ويختفي عند إفراغه", async ({
    browser,
  }) => {
    const { context, page } = await adminOn(browser);
    await page.goto("/en/admin/settings");
    await page.getByLabel("WhatsApp number").fill("+962 79 888 7766");
    await page.getByLabel("Phone", { exact: true }).fill("+962 6 555 1234");
    await page.getByRole("button", { name: "Add point" }).click();
    await page.getByLabel("Title (العربية)").fill("دعم سريع");
    await page.getByLabel("Title (English)").fill("Fast support");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Saved.");

    const guest = await visitorContext(browser);
    const visitor = await guest.newPage();
    await visitor.setViewportSize({ width: 1280, height: 900 });
    await visitor.goto("/en/products/desktop-accounting");
    const floating = visitor.getByRole("link", { name: "Chat on WhatsApp" });
    await expect(floating).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/962798887766\?text=/,
    );
    await expect
      .poll(async () =>
        decodeURIComponent((await floating.getAttribute("href")) ?? ""),
      )
      .toContain("Desktop Accounting");
    await expect(
      visitor.getByRole("link", { name: "WhatsApp", exact: true }).first(),
    ).toBeVisible();
    await visitor.goto("/en");
    await expect(
      visitor.getByRole("heading", { name: "Why choose us" }),
    ).toBeVisible();
    await expect(
      visitor.getByRole("heading", { name: "Fast support" }),
    ).toBeVisible();
    await visitor.goto("/en/contact");
    await expect(visitor.getByText("+962 6 555 1234")).toBeVisible();

    // إفراغ الرقم يخفي كل أزرار واتساب
    await page.goto("/en/admin/settings");
    await page.getByLabel("WhatsApp number").fill("");
    await page.getByRole("button", { name: "Remove" }).click();
    await page.getByLabel("Phone", { exact: true }).fill("");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Saved.");
    await visitor.goto("/en/products/desktop-accounting");
    await expect(
      visitor.getByRole("link", { name: "Chat on WhatsApp" }),
    ).toHaveCount(0);
    await expect(
      visitor.getByRole("heading", { name: "Why choose us" }),
    ).toHaveCount(0);
    await guest.close();
    await context.close();
  });

  test("رقم واتساب غير صالح يُرفض", async ({ browser }) => {
    const { context, page } = await adminOn(browser);
    await page.goto("/en/admin/settings");
    await page.getByLabel("WhatsApp number").fill("12345");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Invalid number.")).toBeVisible();
    await context.close();
  });
});
