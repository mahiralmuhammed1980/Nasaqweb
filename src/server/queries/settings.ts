import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
  contactSettingsSchema,
  DEFAULT_SETTINGS,
  notificationSettingsSchema,
  siteSettingsSchema,
  type SiteSettings,
} from "@/validators/settings";

async function readSettings(): Promise<SiteSettings> {
  const rows = await db.siteSetting.findMany({
    where: { key: { in: ["contact", "notifications", "whyUs"] } },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const contact = contactSettingsSchema.safeParse(byKey.get("contact"));
  const notifications = notificationSettingsSchema.safeParse(
    byKey.get("notifications"),
  );
  const whyUs = siteSettingsSchema.shape.whyUs.safeParse(byKey.get("whyUs"));
  return {
    contact: contact.success ? contact.data : DEFAULT_SETTINGS.contact,
    notifications: notifications.success
      ? notifications.data
      : DEFAULT_SETTINGS.notifications,
    whyUs: whyUs.success ? whyUs.data : DEFAULT_SETTINGS.whyUs,
  };
}

/**
 * إعدادات الموقع مخزَّنة مؤقتاً بوسم `settings` (تبقى الصفحات ثابتة)،
 * ويُبطَل الوسم عند الحفظ من لوحة التحكم.
 */
export const getSiteSettings = unstable_cache(readSettings, ["site-settings"], {
  tags: ["settings"],
  revalidate: 3600,
});

/** قراءة مباشرة دون كاش (لنموذج الإعدادات في الإدارة) */
export const getSiteSettingsFresh = readSettings;

/** بريد استقبال الإشعارات: من الإعدادات وإلا ADMIN_EMAIL */
export async function getNotificationEmail(): Promise<string | null> {
  const { notifications } = await readSettings();
  return notifications.email || process.env.ADMIN_EMAIL?.trim() || null;
}
