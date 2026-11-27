import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AccountMenu } from "./account-menu";
import { LocaleSwitcher } from "./locale-switcher";

// روابط مؤقتة: تُوجَّه كلها للرئيسية حتى تُبنى صفحاتها في المراحل التالية
// learn وcontact روابط مؤقتة للرئيسية حتى تُبنى صفحاتهما (المرحلتان 5 و4)
const NAV = [
  { key: "products", href: "/products" },
  { key: "offers", href: "/offers" },
  { key: "hardware", href: "/hardware" },
  { key: "learn", href: "/" },
  { key: "contact", href: "/" },
] as const;

export async function Header() {
  const t = await getTranslations();
  return (
    <header className="border-border border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-bold">
          {t("Site.name")}
        </Link>
        <nav aria-label={t("Nav.main")} className="hidden gap-1 md:flex">
          {NAV.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="hover:bg-muted rounded-md px-3 py-2 text-sm"
            >
              {t(`Nav.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Suspense>
            <LocaleSwitcher />
          </Suspense>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
