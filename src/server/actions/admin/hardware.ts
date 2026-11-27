"use server";

import { db } from "@/lib/db";
import { hardwareSchema } from "@/validators/hardware";
import { idSchema } from "@/validators/product";
import { revalidateCatalog } from "@/server/revalidate";
import { ActionError, adminAction } from "./admin-action";

const LOCALES = ["ar", "en"] as const;

const save = adminAction(hardwareSchema, async (input) => {
  const owner = await db.hardware.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (owner && owner.id !== input.id) throw new ActionError("SLUG_TAKEN");
  const previous = input.id
    ? await db.hardware.findUnique({
        where: { id: input.id },
        select: {
          slug: true,
          products: { select: { product: { select: { slug: true } } } },
        },
      })
    : null;
  if (input.id && !previous) throw new ActionError("NOT_FOUND");
  if (
    input.categoryId &&
    !(await db.hardwareCategory.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    }))
  ) {
    throw new ActionError("CATEGORY_NOT_FOUND");
  }
  const products = await db.product.findMany({
    where: { id: { in: input.productIds } },
    select: { id: true, slug: true },
  });

  const data = {
    slug: input.slug,
    categoryId: input.categoryId,
    brand: input.brand,
    model: input.model,
    priceType: input.priceType,
    price: input.priceType === "ON_REQUEST" ? null : input.price,
    currency: input.currency,
    inStock: input.inStock,
    status: input.status,
    images: input.images.map((i) => i.url),
    specs: input.specs,
  };

  const hardware = await db.$transaction(async (tx) => {
    const saved = input.id
      ? await tx.hardware.update({ where: { id: input.id }, data })
      : await tx.hardware.create({ data });

    for (const locale of LOCALES) {
      const tr = input[locale];
      if (locale === "en" && !tr.name) {
        await tx.hardwareTranslation.deleteMany({
          where: { hardwareId: saved.id, locale },
        });
        continue;
      }
      await tx.hardwareTranslation.upsert({
        where: { hardwareId_locale: { hardwareId: saved.id, locale } },
        update: tr,
        create: { hardwareId: saved.id, locale, ...tr },
      });
    }

    await tx.hardwareProduct.deleteMany({ where: { hardwareId: saved.id } });
    if (products.length) {
      await tx.hardwareProduct.createMany({
        data: products.map((p) => ({ hardwareId: saved.id, productId: p.id })),
      });
    }
    return saved;
  });

  revalidateCatalog(
    [
      ...products.map((p) => p.slug),
      ...(previous?.products.map((p) => p.product.slug) ?? []),
    ],
    [hardware.slug, previous?.slug],
  );
  return { id: hardware.id, slug: hardware.slug };
});

const remove = adminAction(idSchema, async ({ id }) => {
  const item = await db.hardware.findUnique({
    where: { id },
    select: {
      slug: true,
      products: { select: { product: { select: { slug: true } } } },
    },
  });
  if (!item) throw new ActionError("NOT_FOUND");
  await db.hardware.delete({ where: { id } });
  revalidateCatalog(
    item.products.map((p) => p.product.slug),
    [item.slug],
  );
  return { id };
});

export async function saveHardware(input: unknown) {
  return save(input);
}

export async function deleteHardware(input: unknown) {
  return remove(input);
}
