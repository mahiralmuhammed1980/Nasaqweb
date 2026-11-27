import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/routing";
import { requireUserPage } from "@/lib/auth/page-guards";
import { notFound } from "next/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  await requireUserPage(locale, "/account");
  return <>{children}</>;
}
