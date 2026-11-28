import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/forms/contact-form";
import { isLocale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { whatsappUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Contact" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates(locale, "/contact"),
  };
}

const SOCIAL = [
  "facebook",
  "instagram",
  "x",
  "youtube",
  "linkedin",
  "telegram",
] as const;

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, { contact }] = await Promise.all([
    getTranslations("Contact"),
    getSiteSettings(),
  ]);
  const wa = whatsappUrl(contact.whatsapp, t("whatsappMessage"));
  const hours =
    locale === "en"
      ? contact.workingHoursEn || contact.workingHoursAr
      : contact.workingHoursAr || contact.workingHoursEn;
  const socials = SOCIAL.filter((key) => contact.social[key]);

  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2 mb-6">{t("description")}</p>
        <ContactForm />
      </div>
      <aside aria-label={t("info")} className="space-y-4 text-sm">
        <h2 className="text-lg font-semibold">{t("info")}</h2>
        {wa && (
          <p>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              {t("whatsapp")}
            </a>
          </p>
        )}
        {contact.phone && (
          <p>
            {t("callUs")}{" "}
            <a
              href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
              dir="ltr"
              className="font-medium hover:underline"
            >
              {contact.phone}
            </a>
          </p>
        )}
        {contact.email && (
          <p>
            <a
              href={`mailto:${contact.email}`}
              className="font-medium hover:underline"
            >
              {contact.email}
            </a>
          </p>
        )}
        {hours && (
          <p>
            <span className="text-muted-foreground">{t("hours")}</span> {hours}
          </p>
        )}
        {socials.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {socials.map((key) => (
              <li key={key}>
                <a
                  href={contact.social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t(`social.${key}`)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  );
}
