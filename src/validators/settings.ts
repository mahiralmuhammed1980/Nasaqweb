import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "invalidUrl");

export const contactSettingsSchema = z.object({
  /** رقم دولي يُخزَّن بصيغة E.164؛ فارغ يعني إخفاء أزرار واتساب */
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .refine(
      (v) => v === "" || /^\+?[0-9\s\-()]{8,25}$/.test(v),
      "invalidPhone",
    ),
  phone: z.string().trim().max(30),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "invalidEmail"),
  workingHoursAr: z.string().trim().max(200),
  workingHoursEn: z.string().trim().max(200),
  social: z.object({
    facebook: optionalUrl,
    instagram: optionalUrl,
    x: optionalUrl,
    youtube: optionalUrl,
    linkedin: optionalUrl,
    telegram: optionalUrl,
  }),
});

export const notificationSettingsSchema = z.object({
  /** بريد استقبال إشعارات الطلبات والرسائل؛ فارغ ← ADMIN_EMAIL */
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "invalidEmail"),
});

const whyUsItem = z.object({
  ar: z.object({
    title: z.string().trim().min(1, "required").max(100),
    description: z.string().trim().max(300),
  }),
  en: z.object({
    title: z.string().trim().max(100),
    description: z.string().trim().max(300),
  }),
});

export const siteSettingsSchema = z.object({
  contact: contactSettingsSchema,
  notifications: notificationSettingsSchema,
  whyUs: z.array(whyUsItem).max(4),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type ContactSettings = z.infer<typeof contactSettingsSchema>;

export const DEFAULT_SETTINGS: SiteSettings = {
  contact: {
    whatsapp: "",
    phone: "",
    email: "",
    workingHoursAr: "",
    workingHoursEn: "",
    social: {
      facebook: "",
      instagram: "",
      x: "",
      youtube: "",
      linkedin: "",
      telegram: "",
    },
  },
  notifications: { email: "" },
  whyUs: [],
};
