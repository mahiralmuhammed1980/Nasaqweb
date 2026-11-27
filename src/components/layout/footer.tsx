import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="border-border border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
        <p>
          © {new Date().getFullYear()} {t("Site.name")}. {t("Footer.rights")}
        </p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-foreground">
            {t("Footer.privacy")}
          </Link>
          <Link href="/" className="hover:text-foreground">
            {t("Footer.terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
