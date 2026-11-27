"use server";

import { db } from "@/lib/db";
import { categorySchema, idSchema } from "@/validators/product";
import { revalidateCatalog } from "@/server/revalidate";
import { ActionError, adminAction } from "./admin-action";

const save = adminAction(categorySchema, async (input) => {
  const owner = await db.hardwareCategory.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (owner && owner.id !== input.id) throw new ActionError("SLUG_TAKEN");

  const category = input.id
    ? await db.hardwareCategory.update({
        where: { id: input.id },
        data: { slug: input.slug, sortOrder: input.sortOrder },
      })
    : await db.hardwareCategory.create({
        data: { slug: input.slug, sortOrder: input.sortOrder },
      });

  await db.hardwareCategoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "ar" } },
    update: { name: input.ar.name },
    create: { categoryId: category.id, locale: "ar", name: input.ar.name },
  });
  if (input.en.name) {
    await db.hardwareCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale: "en" } },
      update: { name: input.en.name },
      create: { categoryId: category.id, locale: "en", name: input.en.name },
    });
  } else {
    await db.hardwareCategoryTranslation.deleteMany({
      where: { categoryId: category.id, locale: "en" },
    });
  }
  revalidateCatalog();
  return { id: category.id };
});

const remove = adminAction(idSchema, async ({ id }) => {
  await db.hardwareCategory.delete({ where: { id } });
  revalidateCatalog();
  return { id };
});

export async function saveHardwareCategory(input: unknown) {
  return save(input);
}

export async function deleteHardwareCategory(input: unknown) {
  return remove(input);
}
