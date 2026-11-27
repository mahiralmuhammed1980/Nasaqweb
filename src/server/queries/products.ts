import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { ProductFilters } from "@/validators/catalog-filters";

const PUBLISHED = { status: "PUBLISHED" } as const;

/** تضمين ما تحتاجه بطاقة المنتج */
/** العروض المرتبطة (الفعالة فقط)؛ فحص التاريخ يتم وقت الحساب في getEffectivePrice لا هنا. */
const offersInclude = {
  where: { offer: { isActive: true } },
  include: { offer: { include: { translations: true } } },
} as const;

export const productCardInclude = {
  translations: true,
  category: { include: { translations: true } },
  offers: offersInclude,
} satisfies Prisma.ProductInclude;

export const productDetailInclude = {
  translations: true,
  category: { include: { translations: true } },
  features: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
  media: { orderBy: { sortOrder: "asc" } },
  plans: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
  faqs: { orderBy: { sortOrder: "asc" }, include: { translations: true } },
  offers: offersInclude,
  hardware: {
    where: { hardware: { status: "PUBLISHED" } },
    include: {
      hardware: {
        include: {
          translations: true,
          category: { include: { translations: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductCard = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;
export type ProductDetail = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

function orderFor(
  sort: ProductFilters["sort"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [
        { publishedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ];
    case "price_asc":
      return [{ price: { sort: "asc", nulls: "last" } }, { sortOrder: "asc" }];
    case "price_desc":
      return [{ price: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }];
    default:
      return [
        { featured: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ];
  }
}

export async function listProducts(
  filters: ProductFilters,
): Promise<ProductCard[]> {
  const where: Prisma.ProductWhereInput = { ...PUBLISHED };
  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = { slug: filters.category };
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" as const };
    where.translations = {
      some: {
        OR: [
          { name: contains },
          { tagline: contains },
          { description: contains },
        ],
      },
    };
  }
  return db.product.findMany({
    where,
    orderBy: orderFor(filters.sort),
    include: productCardInclude,
  });
}

export async function listFeaturedProducts(
  type?: ProductFilters["type"],
): Promise<ProductCard[]> {
  return db.product.findMany({
    where: { ...PUBLISHED, featured: true, ...(type ? { type } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: productCardInclude,
  });
}

/** منتج منشور فقط (للعامة). المسودة والمؤرشف يعيدان null. */
export async function getPublishedProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  return db.product.findFirst({
    where: { slug, ...PUBLISHED },
    include: productDetailInclude,
  });
}

/** للمعاينة في الإدارة قبل النشر: أي حالة. */
export async function getProductByIdForPreview(
  id: string,
): Promise<ProductDetail | null> {
  return db.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });
}

export async function listRelatedProducts(
  product: { id: string; categoryId: string | null },
  take = 3,
) {
  if (!product.categoryId) return [];
  return db.product.findMany({
    where: {
      ...PUBLISHED,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take,
    include: productCardInclude,
  });
}

export async function listPublishedProductSlugs() {
  return db.product.findMany({
    where: PUBLISHED,
    select: { slug: true, updatedAt: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listCategoriesWithTranslations() {
  return db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });
}
