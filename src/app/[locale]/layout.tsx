import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { AuthSessionProvider } from "@/components/layout/session-provider";
import { UtmCapture } from "@/components/forms/utm-capture";
import {
  WhatsAppFloating,
  WhatsAppProvider,
} from "@/components/layout/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";
import { Footer } from "@/components/layout/footer";
import { getDirection, isLocale, routing } from "@/i18n/routing";
import "../globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Site" });
  return { title: t("name"), description: t("description") };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { contact } = await getSiteSettings();

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={plexArabic.variable}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <NextIntlClientProvider>
          <AuthSessionProvider>
            <WhatsAppProvider number={contact.whatsapp || null}>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppFloating />
              <UtmCapture />
            </WhatsAppProvider>
          </AuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
