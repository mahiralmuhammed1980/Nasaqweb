import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { toCsv } from "@/lib/csv";
import { pickTranslation } from "@/lib/localized";
import { parseOrderFilters } from "@/validators/admin-orders";
import { listOrdersForExport } from "@/server/queries/admin-orders";

const HEADERS = [
  "number",
  "createdAt",
  "status",
  "name",
  "phone",
  "phoneHasWhatsapp",
  "email",
  "company",
  "city",
  "country",
  "preferredChannel",
  "item",
  "plan",
  "offer",
  "locale",
  "message",
] as const;

/** تصدير CSV للطلبات (بنفس فلاتر القائمة). للمدير فقط، والفحص داخل المعالج نفسه (قاعدة 1). */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN")
    return new NextResponse("Forbidden", { status: 403 });

  const filters = parseOrderFilters(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const orders = await listOrdersForExport(filters);
  const rows = orders.map((o) => [
    o.number,
    o.createdAt,
    o.status,
    o.name,
    o.phone,
    o.phoneHasWhatsapp ? "yes" : "no",
    o.email,
    o.company,
    o.city,
    o.country,
    o.preferredChannel,
    pickTranslation(o.product?.translations ?? [], "ar")?.name ??
      pickTranslation(o.hardware?.translations ?? [], "ar")?.name ??
      "",
    o.plan ? pickTranslation(o.plan.translations, "ar")?.name : "",
    o.offer ? pickTranslation(o.offer.translations, "ar")?.title : "",
    o.locale,
    o.message,
  ]);

  return new NextResponse(toCsv(HEADERS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
