import { createTranslator } from "next-intl";
import { Resend } from "resend";
import { LoginLinkEmail } from "./templates/login-link";
import { localeFromPath } from "@/lib/auth/safe-redirect";

async function loadMessages(locale: "ar" | "en") {
  return (await import(`../../../messages/${locale}.json`)).default;
}

/** يُرسل رابط الدخول. اللغة تُستنتج من بادئة callbackUrl. */
export async function sendLoginLink(params: {
  to: string;
  url: string;
  callbackUrl?: string;
}) {
  const { to, url } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Email provider is not configured");
    // تطوير محلي فقط: الرابط يُطبع في الطرفية (يحوي توكن الدخول، لذلك لا يحدث في الإنتاج).
    console.info("[auth:dev] magic link:", url);
    return;
  }

  const locale = localeFromPath(
    params.callbackUrl ?? new URL(url).searchParams.get("callbackUrl") ?? "",
  );
  const messages = await loadMessages(locale);
  const t = createTranslator({
    locale,
    messages,
    namespace: "Emails.LoginLink",
  });
  const siteName = createTranslator({ locale, messages, namespace: "Site" })(
    "name",
  );

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: t("subject", { siteName }),
    react: LoginLinkEmail({
      locale,
      url,
      siteName,
      texts: {
        preview: t("preview"),
        heading: t("heading"),
        body: t("body"),
        button: t("button"),
        ignore: t("ignore"),
      },
    }),
  });
  if (error) throw new Error(`Resend error: ${error.name}`);
}
