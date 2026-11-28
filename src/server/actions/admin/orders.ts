"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { emailTranslator } from "@/lib/email/i18n";
import { sendEmail } from "@/lib/email/send";
import { NotificationEmail } from "@/lib/email/templates/notification";
import {
  addNoteSchema,
  changeStatusSchema,
  messageStatusSchema,
  replySchema,
} from "@/validators/admin-orders";
import { recordEmailActivity } from "@/server/orders/notify";
import { ActionError, adminAction } from "./admin-action";

function refresh(id: string) {
  for (const locale of ["ar", "en"]) {
    revalidatePath(`/${locale}/admin/orders`);
    revalidatePath(`/${locale}/admin/orders/${id}`);
  }
}

/** تغيير الحالة + سطر في الخط الزمني (من → إلى). تغيير لنفس الحالة لا يُسجَّل. */
const changeStatus = adminAction(
  changeStatusSchema,
  async ({ id, status }, { admin }) => {
    const order = await db.orderRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!order) throw new ActionError("NOT_FOUND");
    if (order.status === status) return { id, status, changed: false };
    await db.$transaction([
      db.orderRequest.update({ where: { id }, data: { status } }),
      db.requestActivity.create({
        data: {
          requestId: id,
          type: "STATUS_CHANGE",
          adminId: admin.id,
          payload: { from: order.status, to: status },
        },
      }),
    ]);
    refresh(id);
    return { id, status, changed: true };
  },
);

const addNote = adminAction(addNoteSchema, async ({ id, text }, { admin }) => {
  if (
    !(await db.orderRequest.findUnique({ where: { id }, select: { id: true } }))
  )
    throw new ActionError("NOT_FOUND");
  await db.requestActivity.create({
    data: { requestId: id, type: "NOTE", adminId: admin.id, payload: { text } },
  });
  refresh(id);
  return { id };
});

/** ردّ بالبريد على الزبون: يُرسَل عبر Resend ويُسجَّل في الخط الزمني (نجاحاً أو فشلاً). */
const reply = adminAction(
  replySchema,
  async ({ id, subject, body }, { admin }) => {
    const order = await db.orderRequest.findUnique({
      where: { id },
      select: { email: true, locale: true },
    });
    if (!order) throw new ActionError("NOT_FOUND");
    if (!order.email) throw new ActionError("NO_CUSTOMER_EMAIL");

    const locale = order.locale === "en" ? "en" : "ar";
    const siteName = (await emailTranslator(locale, "Site"))("name");
    const footer = (await emailTranslator(locale, "Emails.Reply"))("footer");
    const result = await sendEmail({
      to: order.email,
      subject,
      kind: "ADMIN_REPLY",
      react: NotificationEmail({
        locale,
        siteName,
        preview: subject,
        heading: subject,
        body,
        footer,
      }),
    });
    await recordEmailActivity({
      requestId: id,
      kind: "ADMIN_REPLY",
      result,
      subject,
      adminId: admin.id,
    });
    refresh(id);
    if (!result.ok) throw new ActionError("EMAIL_FAILED");
    return { id };
  },
);

const changeMessageStatus = adminAction(
  messageStatusSchema,
  async ({ id, status }) => {
    const message = await db.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!message) throw new ActionError("NOT_FOUND");
    await db.contactMessage.update({ where: { id }, data: { status } });
    for (const locale of ["ar", "en"]) {
      revalidatePath(`/${locale}/admin/messages`);
      revalidatePath(`/${locale}/admin/messages/${id}`);
    }
    return { id, status };
  },
);

export async function changeOrderStatus(input: unknown) {
  return changeStatus(input);
}
export async function addOrderNote(input: unknown) {
  return addNote(input);
}
export async function replyToOrder(input: unknown) {
  return reply(input);
}
export async function changeContactMessageStatus(input: unknown) {
  return changeMessageStatus(input);
}
