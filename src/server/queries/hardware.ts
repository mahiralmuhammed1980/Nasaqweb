import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { productCardInclude } from "./products";

const PUBLISHED = { status: "PUBLISHED" } as const;

export const hardwareCardInclude = {
  translations: true,
  category: { include: { translations: true } },
} satisfies Prisma.HardwareInclude;

export const hardwareDetailInclude = {
  ...hardwareCardInclude,
  products: {
    where: { product: { status: "PUBLISHED" } },
    include: { product: { include: productCardInclude } },
  },
} satisfies Prisma.HardwareInclude;

export type HardwareCard = Prisma.HardwareGetPayload<{
  include: typeof hardwareCardInclude;
}>;
export type HardwareDetail = Prisma.HardwareGetPayload<{
  include: typeof hardwareDetailInclude;
}>;

export async function listHardware(
  categorySlug?: string,
): Promise<HardwareCard[]> {
  return db.hardware.findMany({
    where: {
      ...PUBLISHED,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { createdAt: "desc" }],
    include: hardwareCardInclude,
  });
}

export async function listHardwareCategories() {
  return db.hardwareCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { translations: true },
  });
}

export async function getPublishedHardwareBySlug(
  slug: string,
): Promise<HardwareDetail | null> {
  return db.hardware.findFirst({
    where: { slug, ...PUBLISHED },
    include: hardwareDetailInclude,
  });
}

export async function listPublishedHardwareSlugs() {
  return db.hardware.findMany({
    where: PUBLISHED,
    select: { slug: true, updatedAt: true },
  });
}

export async function listFeaturedHardware(take = 4): Promise<HardwareCard[]> {
  return db.hardware.findMany({
    where: PUBLISHED,
    orderBy: { createdAt: "desc" },
    take,
    include: hardwareCardInclude,
  });
}
