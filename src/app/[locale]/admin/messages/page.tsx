import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { listMessagesForAdmin } from "@/server/queries/admin-orders";

export default async function AdminMessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/messages");
  const [t, messages] = await Promise.all([
    getTranslations("AdminMessages"),
    listMessagesForAdmin(),
  ]);
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {messages.length === 0 ? (
        <p className="text-muted-foreground mt-6">{t("empty")}</p>
      ) : (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 text-start">{t("date")}</th>
              <th className="py-2 text-start">{t("from")}</th>
              <th className="py-2 text-start">{t("subject")}</th>
              <th className="py-2 text-start">{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-border border-b">
                <td className="py-2" dir="ltr">
                  {date.format(m.createdAt)}
                </td>
                <td className="py-2">{m.name}</td>
                <td className="py-2">
                  <Link
                    href={`/admin/messages/${m.id}`}
                    className={`hover:underline ${m.status === "NEW" ? "font-bold" : ""}`}
                  >
                    {m.subject}
                  </Link>
                </td>
                <td className="py-2">{t(`statuses.${m.status}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
