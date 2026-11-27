import { getTranslations } from "next-intl/server";
import { AppImage } from "@/components/ui/app-image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pickTranslation } from "@/lib/localized";
import type { ProductCard as ProductCardData } from "@/server/queries/products";
import { ProductPrice } from "./product-price";

export async function ProductCard({
  product,
  locale,
}: {
  product: ProductCardData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Products" });
  const tr = pickTranslation(product.translations, locale);
  if (!tr) return null;

  return (
    <article className="group border-border bg-background relative flex flex-col overflow-hidden rounded-xl border transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="bg-muted relative aspect-video">
        <AppImage
          src={product.coverImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
        <span className="bg-background/90 absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-medium">
          {t(`types.${product.type}`)}
        </span>
        {product.demoUrl && product.type === "SAAS" && (
          <span className="bg-primary text-primary-foreground absolute end-3 top-3 rounded-full px-3 py-1 text-xs font-medium">
            {t("tryLive")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0"
          >
            {tr.name}
          </Link>
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {tr.tagline}
        </p>
        <p className="mt-auto pt-2 font-semibold">
          <ProductPrice
            priceType={product.priceType}
            price={product.price === null ? null : Number(product.price)}
            currency={product.currency}
            locale={locale}
          />
        </p>
      </div>
    </article>
  );
}
