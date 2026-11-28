import type { ReactElement } from "react";
import { Resend } from "resend";

export type EmailKind =
  | "ADMIN_NEW_ORDER"
  | "CUSTOMER_CONFIRMATION"
  | "ADMIN_NEW_MESSAGE"
  | "ADMIN_REPLY";
export type SendResult =
  | { ok: true; transport: "resend" | "mock" | "dev-log" }
  | { ok: false; reason: string };

/**
 * المحاكاة للاختبارات فقط: EMAIL_TRANSPORT=mock ولا تعمل أبداً في الإنتاج الفعلي (VERCEL_ENV=production).
 * عنوان يبدأ بـ fail@ يفشل عمداً لاختبار أن فشل الإرسال لا يمنع حفظ الطلب.
 */
export function isMockTransport(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.EMAIL_TRANSPORT === "mock" && env.VERCEL_ENV !== "production";
}

type Params = {
  to: string;
  subject: string;
  react: ReactElement;
  kind: EmailKind;
};

/**
 * يرسل بريداً ولا يرمي أبداً: النتيجة تُسجَّل في الخط الزمني والفشل لا يُفشل حفظ الطلب (SPEC §11).
 * لا يُسجَّل عنوان البريد ولا محتواه في السجلات (قاعدة 4)، بل النوع ورمز الخطأ فقط.
 */
export async function sendEmail({
  to,
  subject,
  react,
  kind,
}: Params): Promise<SendResult> {
  try {
    if (isMockTransport()) {
      if (to.toLowerCase().startsWith("fail@"))
        return { ok: false, reason: "MOCK_FAILURE" };
      return { ok: true, transport: "mock" };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      if (process.env.VERCEL_ENV === "production")
        return { ok: false, reason: "NOT_CONFIGURED" };
      console.info(
        `[email:dev] ${kind} not sent (RESEND_API_KEY/EMAIL_FROM not set)`,
      );
      return { ok: true, transport: "dev-log" };
    }

    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      subject,
      react,
    });
    if (error) {
      console.error(`[email] ${kind} failed`, error.name);
      return { ok: false, reason: error.name };
    }
    return { ok: true, transport: "resend" };
  } catch (error) {
    console.error(
      `[email] ${kind} threw`,
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, reason: "EXCEPTION" };
  }
}
