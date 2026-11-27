import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { pickTranslation } from "@/lib/localized";
import { db } from "@/lib/db";
import { listOrders } from "@/server/queries/admin-orders";
import { ORDER_STATUSES, parseOrderFilters } from "@/validators/admin-orders";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const field =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

export default async function AdminOrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireAdminPage(locale, "/admin/orders");
  const filters = parseOrderFilters(await searchParams);
  const t = await getTranslations("AdminOrders");
  const [{ items, total, pages }, products] = await Promise.all([
    listOrders(filters),
    db.product.findMany({
      select: { id: true, slug: true, translations: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value && key !== "page") query.set(key, String(value));
  const page = (n: number) =>
    `/admin/orders?${new URLSearchParams({ ...Object.fromEntries(query), page: String(n) })}`;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild variant="outline">
          {/* مسار API عادي (ملف CSV) لا صفحة، فنستخدم <a> */}
          <a href={`/${locale}/admin/orders/export?${query.toString()}`}>
            {t("exportCsv")}
          </a>
        </Button>
      </div>

      <form
        method="get"
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <label htmlFor="f-q" className="mb-1 block text-sm font-medium">
            {t("search")}
          </label>
          <input
            id="f-q"
            name="q"
            defaultValue={filters.q}
            placeholder={t("searchPlaceholder")}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1 block text-sm font-medium">
            {t("status")}
          </label>
          <select
            id="f-status"
            name="status"
            defaultValue={filters.status ?? ""}
            className={field}
          >
            <option value="">{t("all")}</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`statuses.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-product" className="mb-1 block text-sm font-medium">
            {t("product")}
          </label>
          <select
            id="f-product"
            name="productId"
            defaultValue={filters.productId ?? ""}
            className={field}
          >
            <option value="">{t("all")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {pickTranslation(p.translations, locale)?.name ?? p.slug}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="mb-1 block text-sm font-medium">
            {t("from")}
          </label>
          <input
            id="f-from"
            type="date"
            name="from"
            defaultValue={filters.from}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="f-to" className="mb-1 block text-sm font-medium">
            {t("to")}
          </label>
          <input
            id="f-to"
            type="date"
            name="to"
            defaultValue={filters.to}
            className={field}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-5">
          <Button type="submit">{t("applyFilters")}</Button>
        </div>
      </form>

      <p className="text-muted-foreground mt-6 text-sm" aria-live="polite">
        {t("total", { count: total })}
      </p>

      {items.length === 0 ? (
        <p className="text-muted-foreground mt-6">{t("empty")}</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b text-start">
                <th className="py-2 text-start">#</th>
                <th className="py-2 text-start">{t("date")}</th>
                <th className="py-2 text-start">{t("customer")}</th>
                <th className="py-2 text-start">{t("item")}</th>
                <th className="py-2 text-start">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => {
                const name =
                  (order.product
                    ? pickTranslation(order.product.translations, locale)?.name
                    : order.hardware
                      ? pickTranslation(order.hardware.translations, locale)
                          ?.name
                      : undefined) ?? "—";
                const plan = order.plan
                  ? pickTranslation(order.plan.translations, locale)?.name
                  : null;
                return (
                  <tr key={order.id} className="border-border border-b">
                    <td className="py-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        #{order.number}
                      </Link>
                    </td>
                    <td className="py-2" dir="ltr">
                      {date.format(order.createdAt)}
                    </td>
                    <td className="py-2">
                      {order.name}
                      <span
                        className="text-muted-foreground block text-xs"
                        dir="ltr"
                      >
                        {order.phone}
                      </span>
                    </td>
                    <td className="py-2">
                      {name}
                      {plan && (
                        <span className="text-muted-foreground block text-xs">
                          {plan}
                        </span>
                      )}
                    </td>
                    <td className="py-2">{t(`statuses.${order.status}`)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav
          aria-label={t("pagination")}
          className="mt-6 flex items-center gap-3"
        >
          {filters.page > 1 && (
            <Link
              href={page(filters.page - 1)}
              className="text-primary hover:underline"
            >
              {t("previous")}
            </Link>
          )}
          <span className="text-muted-foreground text-sm">
            {t("pageOf", { page: filters.page, pages })}
          </span>
          {filters.page < pages && (
            <Link
              href={page(filters.page + 1)}
              className="text-primary hover:underline"
            >
              {t("next")}
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
