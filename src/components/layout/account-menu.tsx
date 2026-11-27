"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/auth";

/**
 * عميل فقط: يقرأ الجلسة من /api/auth/session حتى لا تصبح كل الصفحات ديناميكية
 * (صفحات المنتجات يجب أن تبقى ثابتة مع ISR). الحماية الفعلية في الخادم دائماً.
 */
export function AccountMenu() {
  const t = useTranslations("AccountMenu");
  const locale = useLocale();
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="h-9 w-20" aria-hidden />;

  if (!session?.user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">{t("login")}</Link>
      </Button>
    );
  }

  return (
    <details className="relative">
      <summary className="border-border flex h-9 cursor-pointer list-none items-center rounded-md border px-3 text-sm">
        {session.user.name ?? t("account")}
      </summary>
      <div className="border-border bg-background absolute end-0 z-10 mt-2 w-48 rounded-md border p-1 shadow-md">
        <Link
          href="/account"
          className="hover:bg-muted block rounded px-3 py-2 text-sm"
        >
          {t("account")}
        </Link>
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="hover:bg-muted block rounded px-3 py-2 text-sm"
          >
            {t("admin")}
          </Link>
        )}
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="hover:bg-muted block w-full rounded px-3 py-2 text-start text-sm"
          >
            {t("logout")}
          </button>
        </form>
      </div>
    </details>
  );
}
