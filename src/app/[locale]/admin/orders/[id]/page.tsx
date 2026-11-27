import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  OrderNoteForm,
  OrderReplyForm,
  OrderStatusForm,
} from "@/components/admin/order-actions";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { phoneDigits } from "@/lib/phone";
import { pickTranslation } from "@/lib/localized";
import { whatsappUrl } from "@/lib/whatsapp";
import { getOrderForAdmin } from "@/server/queries/admin-orders";

type Props = { params: Promise<{ locale: string; id: string }> };

type Payload = Record<string, unknown>;
const str = (payload: unknown, key: string): string => {
  const value = (payload as Payload | null)?.[key];
  return typeof value === "string" ? value : "";
};

export default async function AdminOrderPage({ params }: Props) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, `/admin/orders/${id}`);
  const [t, order] = await Promise.all([
    getTranslations("AdminOrders"),
    getOrderForAdmin(id),
  ]);
  if (!order) notFound();

  const itemName =
    (order.product
      ? pickTranslation(order.product.translations, locale)?.name
      : order.hardware
        ? pickTranslation(order.hardware.translations, locale)?.name
        : undefined) ?? "—";
  const planName = order.plan
    ? pickTranslation(order.plan.translations, locale)?.name
    : null;
  const offerTitle = order.offer
    ? pickTranslation(order.offer.translations, locale)?.title
    : null;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
  const wa = whatsappUrl(
    order.phone,
    t("whatsappGreeting", { name: order.name, number: order.number }),
  );

  const rows: [string, React.ReactNode][] = [
    [t("item"), itemName],
    ...(planName
      ? ([[t("plan"), planName]] as [string, React.ReactNode][])
      : []),
    ...(offerTitle
      ? ([[t("offer"), offerTitle]] as [string, React.ReactNode][])
      : []),
    [t("customer"), order.name],
    [
      t("phone"),
      <span key="p" dir="ltr">
        {order.phone} {order.phoneHasWhatsapp ? `(${t("hasWhatsapp")})` : ""}
      </span>,
    ],
    ...(order.email
      ? ([
          [
            t("email"),
            <span key="e" dir="ltr">
              {order.email}
            </span>,
          ],
        ] as [string, React.ReactNode][])
      : []),
    ...(order.company
      ? ([[t("company"), order.company]] as [string, React.ReactNode][])
      : []),
    ...([order.city, order.country].filter(Boolean).length
      ? ([
          [
            t("location"),
            [order.city, order.country].filter(Boolean).join("، "),
          ],
        ] as [string, React.ReactNode][])
      : []),
    [t("preferredChannel"), t(`channels.${order.preferredChannel}`)],
    [t("language"), order.locale === "en" ? "English" : "العربية"],
    ...(order.referrer
      ? ([
          [
            t("referrer"),
            <span key="r" dir="ltr">
              {order.referrer}
            </span>,
          ],
        ] as [string, React.ReactNode][])
      : []),
    ...(order.utmSource || order.utmMedium || order.utmCampaign
      ? ([
          [
            t("utm"),
            <span key="u" dir="ltr">
              {[order.utmSource, order.utmMedium, order.utmCampaign]
                .filter(Boolean)
                .join(" / ")}
            </span>,
          ],
        ] as [string, React.ReactNode][])
      : []),
    [
      t("date"),
      <span key="d" dir="ltr">
        {date.format(order.createdAt)} UTC
      </span>,
    ],
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/orders"
          className="text-primary text-sm hover:underline"
        >
          {t("backToList")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {t("orderTitle", { number: order.number })}
        </h1>
      </div>

      <dl className="border-border grid gap-x-6 gap-y-2 rounded-xl border p-4 sm:grid-cols-[180px_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="text-sm">{value}</dd>
          </div>
        ))}
        {order.message && (
          <>
            <dt className="text-muted-foreground text-sm">{t("message")}</dt>
            <dd className="text-sm whitespace-pre-wrap">{order.message}</dd>
          </>
        )}
      </dl>

      <section aria-label={t("quickActions")} className="flex flex-wrap gap-2">
        {wa && (
          <Button asChild variant="outline">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              {t("openWhatsapp")}
            </a>
          </Button>
        )}
        <Button asChild variant="outline">
          <a href={`tel:+${phoneDigits(order.phone)}`}>{t("call")}</a>
        </Button>
        {order.email && (
          <Button asChild variant="outline">
            <a href="#reply">{t("replyByEmail")}</a>
          </Button>
        )}
      </section>

      <section className="border-border space-y-3 rounded-xl border p-4">
        <OrderStatusForm id={order.id} status={order.status} />
      </section>

      <section aria-labelledby="timeline-title" className="space-y-3">
        <h2 id="timeline-title" className="text-lg font-semibold">
          {t("timeline")}
        </h2>
        <ol className="border-border space-y-3 border-s ps-4">
          {order.activities.map((activity) => (
            <li
              key={activity.id}
              className="text-sm"
              data-activity={activity.type}
            >
              <span className="text-muted-foreground block text-xs" dir="ltr">
                {date.format(activity.createdAt)} UTC
              </span>
              {activity.type === "STATUS_CHANGE" && (
                <span>
                  {t("activity.statusChange", {
                    from: t(
                      `statuses.${str(activity.payload, "from") || "NEW"}`,
                    ),
                    to: t(`statuses.${str(activity.payload, "to") || "NEW"}`),
                  })}
                </span>
              )}
              {activity.type === "NOTE" && (
                <span className="whitespace-pre-wrap">
                  {t("activity.note", { text: str(activity.payload, "text") })}
                </span>
              )}
              {activity.type === "EMAIL_SENT" && (
                <span>
                  {t(
                    `activity.email.${str(activity.payload, "status") === "SENT" ? "sent" : "failed"}`,
                    {
                      kind: t(
                        `emailKinds.${str(activity.payload, "kind") || "ADMIN_REPLY"}`,
                      ),
                      subject: str(activity.payload, "subject"),
                    },
                  )}
                </span>
              )}
            </li>
          ))}
          {order.activities.length === 0 && (
            <li className="text-muted-foreground text-sm">{t("noActivity")}</li>
          )}
        </ol>
      </section>

      <section className="border-border rounded-xl border p-4">
        <OrderNoteForm id={order.id} />
      </section>

      {order.email ? (
        <section
          id="reply"
          className="border-border space-y-2 rounded-xl border p-4"
        >
          <h2 className="text-lg font-semibold">{t("replyByEmail")}</h2>
          <OrderReplyForm
            id={order.id}
            defaultSubject={t("replyDefaultSubject", { number: order.number })}
          />
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">{t("noEmailOnOrder")}</p>
      )}
    </div>
  );
}
