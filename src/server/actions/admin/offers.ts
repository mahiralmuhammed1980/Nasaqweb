"use server";

import { db } from "@/lib/db";
import { offerSchema } from "@/validators/offer";
import { idSchema } from "@/validators/product";
import { revalidateCatalog } from "@/server/revalidate";
import { ActionError, adminAction } from "./admin-action";

const LOCALES = ["ar", "en"] as const;

const save = adminAction(offerSchema, async (input) => {
  const owner = await db.offer.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (owner && owner.id !== input.id) throw new ActionError("SLUG_TAKEN");
  if (
    input.id &&
    !(await db.offer.findUnique({
      where: { id: input.id },
      select: { id: true },
    }))
  ) {
    throw new ActionError("NOT_FOUND");
  }

  // نقبل فقط معرّفات منتجات موجودة فعلاً
  const products = await db.product.findMany({
    where: { id: { in: input.productIds } },
    select: { id: true, slug: true },
  });

  const data = {
    slug: input.slug,
    discountType: input.discountType,
    discountValue: input.discountValue,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    isActive: input.isActive,
    bannerImage: input.bannerImage,
    couponCode: input.couponCode,
  };

  const previousProducts = input.id
    ? await db.offerProduct.findMany({
        where: { offerId: input.id },
        include: { product: { select: { slug: true } } },
      })
    : [];

  const offer = await db.$transaction(async (tx) => {
    const saved = input.id
      ? await tx.offer.update({ where: { id: input.id }, data })
      : await tx.offer.create({ data });

    for (const locale of LOCALES) {
      const tr = input[locale];
      if (locale === "en" && !tr.title) {
        await tx.offerTranslation.deleteMany({
          where: { offerId: saved.id, locale },
        });
        continue;
      }
      await tx.offerTranslation.upsert({
        where: { offerId_locale: { offerId: saved.id, locale } },
        update: tr,
        create: { offerId: saved.id, locale, ...tr },
      });
    }

    await tx.offerProduct.deleteMany({ where: { offerId: saved.id } });
    if (products.length) {
      await tx.offerProduct.createMany({
        data: products.map((p) => ({ offerId: saved.id, productId: p.id })),
      });
    }
    return saved;
  });

  revalidateCatalog([
    ...products.map((p) => p.slug),
    ...previousProducts.map((p) => p.product.slug),
  ]);
  return { id: offer.id };
});

const remove = adminAction(idSchema, async ({ id }) => {
  const linked = await db.offerProduct.findMany({
    where: { offerId: id },
    include: { product: { select: { slug: true } } },
  });
  await db.offer.delete({ where: { id } });
  revalidateCatalog(linked.map((l) => l.product.slug));
  return { id };
});

export async function saveOffer(input: unknown) {
  return save(input);
}

export async function deleteOffer(input: unknown) {
  return remove(input);
}
