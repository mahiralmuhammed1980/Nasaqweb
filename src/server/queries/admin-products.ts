import { db } from "@/lib/db";
import { productDetailInclude } from "./products";

/** قراءات الإدارة: كل الحالات (مسودة ومؤرشف أيضاً). تُستدعى فقط بعد requireAdminPage. */
export async function listProductsForAdmin() {
  return db.product.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      translations: true,
      category: { include: { translations: true } },
    },
  });
}

export async function getProductForAdmin(id: string) {
  return db.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });
}
