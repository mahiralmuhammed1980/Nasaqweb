import { db } from "@/lib/db";
import { productCardInclude } from "./products";

/** العروض السارية الآن: فعّالة وضمن [startsAt, endsAt). تُحسب وقت الطلب دون مهام مجدولة. */
export async function listActiveOffers(now: Date = new Date()) {
  return db.offer.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gt: now } },
    orderBy: [{ endsAt: "asc" }],
    include: {
      translations: true,
      products: {
        where: { product: { status: "PUBLISHED" } },
        include: { product: { include: productCardInclude } },
      },
    },
  });
}

export type ActiveOffer = Awaited<ReturnType<typeof listActiveOffers>>[number];
