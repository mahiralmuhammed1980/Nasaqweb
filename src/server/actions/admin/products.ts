"use server";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { splitLines } from "@/lib/text";
import {
  idSchema,
  productSchema,
  type ProductInput,
} from "@/validators/product";
import { revalidateCatalog } from "@/server/revalidate";
import { ActionError, adminAction } from "./admin-action";

type Tx = Prisma.TransactionClient;
const LOCALES = ["ar", "en"] as const;

async function syncFeatures(
  tx: Tx,
  productId: string,
  items: ProductInput["features"],
) {
  const existing = await tx.productFeature.findMany({
    where: { productId },
    select: { id: true },
  });
  const owned = new Set(existing.map((e) => e.id));
  const keep = new Set(
    items.map((i) => i.id).filter((id): id is string => !!id && owned.has(id)),
  );
  await tx.productFeature.deleteMany({
    where: { productId, id: { notIn: [...keep] } },
  });

  for (const [index, item] of items.entries()) {
    const id = item.id && owned.has(item.id) ? item.id : undefined;
    const feature = id
      ? await tx.productFeature.update({
          where: { id },
          data: { icon: item.icon, sortOrder: index },
        })
      : await tx.productFeature.create({
          data: { productId, icon: item.icon, sortOrder: index },
        });
    for (const locale of LOCALES) {
      const tr = item[locale];
      if (locale === "en" && !tr.title) {
        await tx.productFeatureTranslation.deleteMany({
          where: { featureId: feature.id, locale },
        });
        continue;
      }
      await tx.productFeatureTranslation.upsert({
        where: { featureId_locale: { featureId: feature.id, locale } },
        update: { title: tr.title, description: tr.description },
        create: {
          featureId: feature.id,
          locale,
          title: tr.title,
          description: tr.description,
        },
      });
    }
  }
}

async function syncMedia(
  tx: Tx,
  productId: string,
  items: ProductInput["media"],
) {
  const existing = await tx.productMedia.findMany({
    where: { productId },
    select: { id: true },
  });
  const owned = new Set(existing.map((e) => e.id));
  const keep = new Set(
    items.map((i) => i.id).filter((id): id is string => !!id && owned.has(id)),
  );
  await tx.productMedia.deleteMany({
    where: { productId, id: { notIn: [...keep] } },
  });
  for (const [index, item] of items.entries()) {
    const data = {
      url: item.url,
      altAr: item.altAr,
      altEn: item.altEn,
      sortOrder: index,
    };
    if (item.id && owned.has(item.id))
      await tx.productMedia.update({ where: { id: item.id }, data });
    else await tx.productMedia.create({ data: { productId, ...data } });
  }
}

async function syncPlans(
  tx: Tx,
  productId: string,
  items: ProductInput["plans"],
) {
  // الخطط تُحدَّث في مكانها (لا حذف وإعادة إنشاء) لأن الطلبات ستشير إليها لاحقاً.
  const existing = await tx.productPlan.findMany({
    where: { productId },
    select: { id: true },
  });
  const owned = new Set(existing.map((e) => e.id));
  const keep = new Set(
    items.map((i) => i.id).filter((id): id is string => !!id && owned.has(id)),
  );
  await tx.productPlan.deleteMany({
    where: { productId, id: { notIn: [...keep] } },
  });

  for (const [index, item] of items.entries()) {
    const data = {
      price: item.price,
      billingPeriod: item.billingPeriod,
      highlighted: item.highlighted,
      sortOrder: index,
    };
    const id = item.id && owned.has(item.id) ? item.id : undefined;
    const plan = id
      ? await tx.productPlan.update({ where: { id }, data })
      : await tx.productPlan.create({ data: { productId, ...data } });
    for (const locale of LOCALES) {
      const tr = item[locale];
      if (locale === "en" && !tr.name) {
        await tx.productPlanTranslation.deleteMany({
          where: { planId: plan.id, locale },
        });
        continue;
      }
      const features = splitLines(tr.featuresText);
      await tx.productPlanTranslation.upsert({
        where: { planId_locale: { planId: plan.id, locale } },
        update: { name: tr.name, features },
        create: { planId: plan.id, locale, name: tr.name, features },
      });
    }
  }
}

async function syncFaqs(
  tx: Tx,
  productId: string,
  items: ProductInput["faqs"],
) {
  const existing = await tx.productFaq.findMany({
    where: { productId },
    select: { id: true },
  });
  const owned = new Set(existing.map((e) => e.id));
  const keep = new Set(
    items.map((i) => i.id).filter((id): id is string => !!id && owned.has(id)),
  );
  await tx.productFaq.deleteMany({
    where: { productId, id: { notIn: [...keep] } },
  });

  for (const [index, item] of items.entries()) {
    const id = item.id && owned.has(item.id) ? item.id : undefined;
    const faq = id
      ? await tx.productFaq.update({
          where: { id },
          data: { sortOrder: index },
        })
      : await tx.productFaq.create({ data: { productId, sortOrder: index } });
    for (const locale of LOCALES) {
      const tr = item[locale];
      if (locale === "en" && !tr.question) {
        await tx.productFaqTranslation.deleteMany({
          where: { faqId: faq.id, locale },
        });
        continue;
      }
      await tx.productFaqTranslation.upsert({
        where: { faqId_locale: { faqId: faq.id, locale } },
        update: { question: tr.question, answer: tr.answer },
        create: {
          faqId: faq.id,
          locale,
          question: tr.question,
          answer: tr.answer,
        },
      });
    }
  }
}

const save = adminAction(productSchema, async (input) => {
  const slugOwner = await db.product.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (slugOwner && slugOwner.id !== input.id)
    throw new ActionError("SLUG_TAKEN");
  if (input.categoryId) {
    const category = await db.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) throw new ActionError("CATEGORY_NOT_FOUND");
  }

  const previous = input.id
    ? await db.product.findUnique({
        where: { id: input.id },
        select: { slug: true, publishedAt: true },
      })
    : null;
  if (input.id && !previous) throw new ActionError("NOT_FOUND");

  const data = {
    slug: input.slug,
    type: input.type,
    status: input.status,
    categoryId: input.categoryId,
    priceType: input.priceType,
    price: input.priceType === "ON_REQUEST" ? null : input.price,
    currency: input.currency,
    featured: input.featured,
    sortOrder: input.sortOrder,
    version: input.version,
    platforms: input.platforms,
    coverImage: input.coverImage,
    demoUrl: input.demoUrl,
    demoUsername: input.demoUsername,
    demoPassword: input.demoPassword,
    demoEmbeddable: input.demoEmbeddable,
    videoProvider: input.videoProvider,
    videoId: input.videoId,
    trialDownloadUrl: input.trialDownloadUrl,
    publishedAt:
      input.status === "PUBLISHED"
        ? (previous?.publishedAt ?? new Date())
        : (previous?.publishedAt ?? null),
  };

  const product = await db.$transaction(async (tx) => {
    const saved = input.id
      ? await tx.product.update({ where: { id: input.id }, data })
      : await tx.product.create({ data });

    for (const locale of LOCALES) {
      const tr = input[locale];
      if (locale === "en" && !tr.name) {
        await tx.productTranslation.deleteMany({
          where: { productId: saved.id, locale },
        });
        continue;
      }
      await tx.productTranslation.upsert({
        where: { productId_locale: { productId: saved.id, locale } },
        update: tr,
        create: { productId: saved.id, locale, ...tr },
      });
    }
    await syncFeatures(tx, saved.id, input.features);
    await syncMedia(tx, saved.id, input.media);
    await syncPlans(tx, saved.id, input.plans);
    await syncFaqs(tx, saved.id, input.faqs);
    return saved;
  });

  revalidateCatalog([product.slug, previous?.slug]);
  return { id: product.id, slug: product.slug };
});

const remove = adminAction(idSchema, async ({ id }) => {
  const product = await db.product.delete({
    where: { id },
    select: { slug: true },
  });
  revalidateCatalog([product.slug]);
  return { id };
});

export async function saveProduct(input: unknown) {
  return save(input);
}

export async function deleteProduct(input: unknown) {
  return remove(input);
}
