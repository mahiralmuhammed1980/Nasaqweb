import { getTranslations } from "next-intl/server";
import { AppImage } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { pickTranslation } from "@/lib/localized";
import type { HardwareCard as HardwareCardData } from "@/server/queries/hardware";

export async function HardwareCard({
  hardware,
  locale,
}: {
  hardware: HardwareCardData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Hardware" });
  const tr = pickTranslation(hardware.translations, locale);
  if (!tr) return null;
  const image = hardware.images[0];
  const category = hardware.category
    ? pickTranslation(hardware.category.translations, locale)?.name
    : undefined;

  return (
    <article className="group border-border bg-background relative flex flex-col overflow-hidden rounded-xl border transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="bg-muted relative aspect-video">
        {image && (
          <AppImage
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        {category && (
          <span className="bg-background/90 absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-medium">
            {category}
          </span>
        )}
        {!hardware.inStock && (
          <span className="absolute end-3 top-3 rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-white">
            {t("outOfStock")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg font-semibold">
          <Link
            href={`/hardware/${hardware.slug}`}
            className="after:absolute after:inset-0"
          >
            {tr.name}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm">
          {hardware.brand} · {hardware.model}
        </p>
        <p className="mt-auto pt-2 font-semibold">
          {hardware.priceType === "ON_REQUEST" || hardware.price === null
            ? t("priceOnRequest")
            : formatMoney(Number(hardware.price), hardware.currency, locale)}
        </p>
      </div>
    </article>
  );
}
