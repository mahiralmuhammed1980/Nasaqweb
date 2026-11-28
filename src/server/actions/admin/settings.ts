"use server";

import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { siteSettingsSchema } from "@/validators/settings";
import { ActionError, adminAction } from "./admin-action";

const save = adminAction(siteSettingsSchema, async (input) => {
  // رقم واتساب يُخزَّن بصيغة دولية موحّدة (أو فارغاً)
  let whatsapp = "";
  if (input.contact.whatsapp) {
    const normalized = normalizePhone(input.contact.whatsapp);
    if (!normalized) throw new ActionError("invalidPhone");
    whatsapp = normalized;
  }
  const entries: [string, unknown][] = [
    ["contact", { ...input.contact, whatsapp }],
    ["notifications", input.notifications],
    ["whyUs", input.whyUs],
  ];
  await db.$transaction(
    entries.map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object },
      }),
    ),
  );
  // الإعدادات تظهر في كل الصفحات (زر واتساب العائم...)
  updateTag("settings");
  revalidatePath("/", "layout");
  return { saved: true };
});

export async function saveSiteSettings(input: unknown) {
  return save(input);
}
