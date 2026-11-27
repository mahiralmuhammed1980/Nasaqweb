import { db } from "@/lib/db";
import { emailTranslator } from "@/lib/email/i18n";
import { sendEmail, type EmailKind, type SendResult } from "@/lib/email/send";
import { NotificationEmail } from "@/lib/email/templates/notification";
import { pickTranslation } from "@/lib/localized";
import { absoluteUrl } from "@/lib/seo";
import { getNotificationEmail } from "@/server/queries/settings";

type Locale = "ar" | "en";

/** نسجّل نتيجة كل بريد في الخط الزمني للطلب (نجاح أو فشل) دون أن يؤثر ذلك على حفظ الطلب. */
export async function recordEmailActivity(params: {
  requestId: string;
  kind: EmailKind;
  result: SendResult;
  subject: string;
  adminId?: string | null;
}) {
  const { requestId, kind, result, subject, adminId } = params;
  try {
    await db.requestActivity.create({
      data: {
        requestId,
        type: "EMAIL_SENT",
        adminId: adminId ?? null,
        payload: result.ok
          ? { kind, status: "SENT", transport: result.transport, subject }
          : { kind, status: "FAILED", reason: result.reason, subject },
      },
    });
  } catch (error) {
    console.error(
      "[orders] could not record email activity",
      error instanceof Error ? error.name : "unknown",
    );
  }
}

/** بريد المدير + تأكيد الزبون. لا يرمي أبداً: الطلب محفوظ قبل استدعائه. */
export async function notifyNewOrder(orderId: string): Promise<void> {
  try {
    const order = await db.orderRequest.findUnique({
      where: { id: orderId },
      include: {
        product: { include: { translations: true } },
        hardware: { include: { translations: true } },
        plan: { include: { translations: true } },
        offer: { include: { translations: true } },
      },
    });
    if (!order) return;

    const locale: Locale = order.locale === "en" ? "en" : "ar";
    const t = await emailTranslator(locale, "Emails.Order");
    const common = await emailTranslator(locale, "Emails.Common");
    const channels = await emailTranslator(locale, "Orders.channels");
    const siteName = (await emailTranslator(locale, "Site"))("name");

    const itemName =
      (order.product
        ? pickTranslation(order.product.translations, locale)?.name
        : order.hardware
          ? pickTranslation(order.hardware.translations, locale)?.name
          : undefined) ?? "—";
    const planName = order.plan
      ? pickTranslation(order.plan.translations, locale)?.name
      : undefined;
    const offerTitle = order.offer
      ? pickTranslation(order.offer.translations, locale)?.title
      : undefined;
    const channelLabel = channels(order.preferredChannel);

    // 1) بريد المدير
    const adminTo = await getNotificationEmail();
    const adminSubject = t("adminSubject", {
      number: order.number,
      item: itemName,
    });
    if (adminTo) {
      const details = [
        { label: t("labels.item"), value: itemName },
        ...(planName ? [{ label: t("labels.plan"), value: planName }] : []),
        ...(offerTitle
          ? [{ label: t("labels.offer"), value: offerTitle }]
          : []),
        { label: t("labels.name"), value: order.name },
        {
          label: t("labels.phone"),
          value: `${order.phone}${order.phoneHasWhatsapp ? ` (${common("whatsapp")})` : ""}`,
        },
        ...(order.email
          ? [{ label: t("labels.email"), value: order.email }]
          : []),
        ...(order.company
          ? [{ label: t("labels.company"), value: order.company }]
          : []),
        ...([order.city, order.country].filter(Boolean).length
          ? [
              {
                label: t("labels.location"),
                value: [order.city, order.country].filter(Boolean).join("، "),
              },
            ]
          : []),
        { label: t("labels.channel"), value: channelLabel },
      ];
      const result = await sendEmail({
        to: adminTo,
        subject: adminSubject,
        kind: "ADMIN_NEW_ORDER",
        react: NotificationEmail({
          locale,
          siteName,
          preview: adminSubject,
          heading: t("adminHeading", { number: order.number }),
          details,
          body: order.message ?? undefined,
          cta: {
            label: t("adminCta"),
            url: absoluteUrl(locale, `/admin/orders/${order.id}`),
          },
        }),
      });
      await recordEmailActivity({
        requestId: order.id,
        kind: "ADMIN_NEW_ORDER",
        result,
        subject: adminSubject,
      });
    } else {
      await recordEmailActivity({
        requestId: order.id,
        kind: "ADMIN_NEW_ORDER",
        result: { ok: false, reason: "NO_RECIPIENT" },
        subject: adminSubject,
      });
    }

    // 2) تأكيد الزبون (فقط إن أدخل بريداً)
    if (order.email) {
      const subject = t("customerSubject", { number: order.number, siteName });
      const result = await sendEmail({
        to: order.email,
        subject,
        kind: "CUSTOMER_CONFIRMATION",
        react: NotificationEmail({
          locale,
          siteName,
          preview: subject,
          heading: t("customerHeading", { number: order.number }),
          intro: t("customerIntro", { channel: channelLabel }),
          details: [
            { label: t("labels.item"), value: itemName },
            ...(planName ? [{ label: t("labels.plan"), value: planName }] : []),
          ],
          footer: t("customerFooter"),
        }),
      });
      await recordEmailActivity({
        requestId: order.id,
        kind: "CUSTOMER_CONFIRMATION",
        result,
        subject,
      });
    }
  } catch (error) {
    console.error(
      "[orders] notifyNewOrder failed",
      error instanceof Error ? error.name : "unknown",
    );
  }
}

/** إشعار المدير برسالة تواصل جديدة. لا يرمي أبداً. */
export async function notifyNewContactMessage(
  messageId: string,
): Promise<void> {
  try {
    const message = await db.contactMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) return;
    const adminTo = await getNotificationEmail();
    if (!adminTo) return;
    const locale: Locale = message.locale === "en" ? "en" : "ar";
    const t = await emailTranslator(locale, "Emails.Contact");
    const siteName = (await emailTranslator(locale, "Site"))("name");
    const subject = t("adminSubject", { subject: message.subject });
    const result = await sendEmail({
      to: adminTo,
      subject,
      kind: "ADMIN_NEW_MESSAGE",
      react: NotificationEmail({
        locale,
        siteName,
        preview: subject,
        heading: t("adminHeading"),
        details: [
          { label: t("labels.name"), value: message.name },
          ...(message.email
            ? [{ label: t("labels.email"), value: message.email }]
            : []),
          ...(message.phone
            ? [{ label: t("labels.phone"), value: message.phone }]
            : []),
          { label: t("labels.subject"), value: message.subject },
        ],
        body: message.message,
        cta: {
          label: t("adminCta"),
          url: absoluteUrl(locale, `/admin/messages/${message.id}`),
        },
      }),
    });
    if (!result.ok)
      console.error("[contact] admin notification failed", result.reason);
  } catch (error) {
    console.error(
      "[contact] notifyNewContactMessage failed",
      error instanceof Error ? error.name : "unknown",
    );
  }
}
