import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MessageStatusButtons } from "@/components/admin/message-status";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { phoneDigits } from "@/lib/phone";
import { getMessageForAdmin } from "@/server/queries/admin-orders";

export default async function AdminMessagePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, `/admin/messages/${id}`);
  const [t, message] = await Promise.all([
    getTranslations("AdminMessages"),
    getMessageForAdmin(id),
  ]);
  if (!message) notFound();
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/messages"
          className="text-primary text-sm hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{message.subject}</h1>
        <p className="text-muted-foreground text-sm" dir="ltr">
          {date.format(message.createdAt)} UTC
        </p>
      </div>
      <dl className="border-border grid gap-x-6 gap-y-2 rounded-xl border p-4 sm:grid-cols-[140px_1fr]">
        <dt className="text-muted-foreground text-sm">{t("from")}</dt>
        <dd className="text-sm">{message.name}</dd>
        {message.email && (
          <>
            <dt className="text-muted-foreground text-sm">{t("email")}</dt>
            <dd className="text-sm" dir="ltr">
              {message.email}
            </dd>
          </>
        )}
        {message.phone && (
          <>
            <dt className="text-muted-foreground text-sm">{t("phone")}</dt>
            <dd className="text-sm" dir="ltr">
              {message.phone}
            </dd>
          </>
        )}
      </dl>
      <p className="border-border rounded-xl border p-4 text-sm whitespace-pre-wrap">
        {message.message}
      </p>
      <div className="flex flex-wrap gap-2">
        {message.email && (
          <Button asChild variant="outline">
            <a
              href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
            >
              {t("replyByEmail")}
            </a>
          </Button>
        )}
        {message.phone && (
          <Button asChild variant="outline">
            <a href={`tel:+${phoneDigits(message.phone)}`}>{t("call")}</a>
          </Button>
        )}
      </div>
      <MessageStatusButtons id={message.id} status={message.status} />
    </div>
  );
}
