import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <Button asChild className="mt-6">
        <Link href="/">{t("back")}</Link>
      </Button>
    </section>
  );
}
