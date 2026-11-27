import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { OrderFilters } from "@/validators/admin-orders";

export const ORDERS_PAGE_SIZE = 25;

export function ordersWhere(
  filters: OrderFilters,
): Prisma.OrderRequestWhereInput {
  const where: Prisma.OrderRequestWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.productId) where.productId = filters.productId;
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from
        ? { gte: new Date(`${filters.from}T00:00:00.000Z`) }
        : {}),
      ...(filters.to
        ? {
            lt: new Date(
              new Date(`${filters.to}T00:00:00.000Z`).getTime() +
                24 * 3600 * 1000,
            ),
          }
        : {}),
    };
  }
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" as const };
    const digits = filters.q.replace(/\D/g, "");
    where.OR = [
      { name: contains },
      { phone: contains },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
      ...(/^\d+$/.test(filters.q) ? [{ number: Number(filters.q) }] : []),
    ];
  }
  return where;
}

const listInclude = {
  product: { include: { translations: true } },
  hardware: { include: { translations: true } },
  plan: { include: { translations: true } },
  offer: { include: { translations: true } },
} satisfies Prisma.OrderRequestInclude;

export async function listOrders(filters: OrderFilters) {
  const where = ordersWhere(filters);
  const [items, total] = await Promise.all([
    db.orderRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      include: listInclude,
    }),
    db.orderRequest.count({ where }),
  ]);
  return {
    items,
    total,
    pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  };
}

/** كل الطلبات المطابقة للتصدير (سقف 5000 صف لحماية الذاكرة) */
export async function listOrdersForExport(filters: OrderFilters) {
  return db.orderRequest.findMany({
    where: ordersWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: listInclude,
  });
}

export async function getOrderForAdmin(id: string) {
  return db.orderRequest.findUnique({
    where: { id },
    include: { ...listInclude, activities: { orderBy: { createdAt: "asc" } } },
  });
}

export type AdminOrderListItem = Awaited<
  ReturnType<typeof listOrders>
>["items"][number];
export type AdminOrderDetail = NonNullable<
  Awaited<ReturnType<typeof getOrderForAdmin>>
>;

export async function listMessagesForAdmin(
  status?: "NEW" | "READ" | "HANDLED",
) {
  return db.contactMessage.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getMessageForAdmin(id: string) {
  return db.contactMessage.findUnique({ where: { id } });
}
