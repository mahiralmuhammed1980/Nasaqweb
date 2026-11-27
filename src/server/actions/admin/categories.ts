"use server";

import { db } from "@/lib/db";
import { categorySchema, idSchema } from "@/validators/product";
import { revalidateCatalog } from "@/server/revalidate";
import { ActionError, adminAction } from "./admin-action";

const save = adminAction(categorySchema, async (input) => {
  const owner = await db.category.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (owner && owner.id !== input.id) throw new ActionError("SLUG_TAKEN");

  const category = input.id
    ? await db.category.update({
        where: { id: input.id },
        data: { slug: input.slug, sortOrder: input.sortOrder },
      })
    : await db.category.create({
        data: { slug: input.slug, sortOrder: input.sortOrder },
      });

  await db.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "ar" } },
    update: { name: input.ar.name },
    create: { categoryId: category.id, locale: "ar", name: input.ar.name },
  });
  if (input.en.name) {
    await db.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale: "en" } },
      update: { name: input.en.name },
      create: { categoryId: category.id, locale: "en", name: input.en.name },
    });
  } else {
    await db.categoryTranslation.deleteMany({
      where: { categoryId: category.id, locale: "en" },
    });
  }
  revalidateCatalog();
  return { id: category.id };
});

const remove = adminAction(idSchema, async ({ id }) => {
  await db.category.delete({ where: { id } }); // المنتجات تبقى بلا تصنيف (SetNull)
  revalidateCatalog();
  return { id };
});

export async function saveCategory(input: unknown) {
  return save(input);
}

export async function deleteCategory(input: unknown) {
  return remove(input);
}
