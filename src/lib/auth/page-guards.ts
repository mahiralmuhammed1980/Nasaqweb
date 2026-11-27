import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCurrentUser, type SessionUser } from "./guards";

/** للصفحات المحمية: الزائر يُحوَّل إلى /login ثم يعود بعد الدخول. */
export async function requireUserPage(
  locale: Locale,
  returnPath: string,
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({
      href: {
        pathname: "/login",
        query: { callbackUrl: `/${locale}${returnPath}` },
      },
      locale,
    });
  }
  return user as SessionUser;
}

/** لصفحات /admin: غير المدير لا يرى شيئاً (404) والزائر يذهب للدخول. */
export async function requireAdminPage(
  locale: Locale,
  returnPath: string,
): Promise<SessionUser> {
  const user = await requireUserPage(locale, returnPath);
  if (user.role !== "ADMIN") notFound();
  return user;
}
