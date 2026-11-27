import { db } from "@/lib/db";

/** قراءات الإدارة؛ تُستدعى فقط بعد requireAdminPage. */
export async function listOffersForAdmin() {
  return db.offer.findMany({
    orderBy: { endsAt: "desc" },
    include: { translations: true, _count: { select: { products: true } } },
  });
}

export async function getOfferForAdmin(id: string) {
  return db.offer.findUnique({
    where: { id },
    include: { translations: true, products: { select: { productId: true } } },
  });
}

export async function listHardwareForAdmin() {
  return db.hardware.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      translations: true,
      category: { include: { translations: true } },
    },
  });
}

export async function getHardwareForAdmin(id: string) {
  return db.hardware.findUnique({
    where: { id },
    include: { translations: true, products: { select: { productId: true } } },
  });
}

export async function listProductOptions() {
  return db.product.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, translations: true },
  });
}
