"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  PRODUCT_SORTS,
  PRODUCT_TYPE_FILTERS,
} from "@/validators/catalog-filters";

type CategoryOption = { slug: string; name: string };

/** الفلاتر تُكتب في الرابط (query params) فتكون قابلة للمشاركة وتعمل عند الفتح المباشر. */
export function ProductFilters({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const t = useTranslations("Products");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(
    () => () => void (timer.current && clearTimeout(timer.current)),
    [],
  );

  function onSearch(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => update("q", value.trim()), 350);
  }

  const type = params.get("type") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "featured";
  const field =
    "h-10 rounded-md border border-border bg-background px-3 text-sm";

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div>
        <label htmlFor="f-q" className="mb-1 block text-sm font-medium">
          {t("search")}
        </label>
        <input
          id="f-q"
          type="search"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`${field} w-full`}
        />
      </div>
      <div>
        <label htmlFor="f-type" className="mb-1 block text-sm font-medium">
          {t("filterType")}
        </label>
        <select
          id="f-type"
          value={type}
          onChange={(e) => update("type", e.target.value)}
          className={`${field} w-full`}
        >
          <option value="">{t("all")}</option>
          {PRODUCT_TYPE_FILTERS.map((value) => (
            <option key={value} value={value}>
              {t(`types.${value}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-category" className="mb-1 block text-sm font-medium">
          {t("filterCategory")}
        </label>
        <select
          id="f-category"
          value={category}
          onChange={(e) => update("category", e.target.value)}
          className={`${field} w-full`}
        >
          <option value="">{t("all")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-sort" className="mb-1 block text-sm font-medium">
          {t("sortLabel")}
        </label>
        <select
          id="f-sort"
          value={sort === "featured" ? "" : sort}
          onChange={(e) => update("sort", e.target.value)}
          className={`${field} w-full`}
        >
          {PRODUCT_SORTS.map((value) => (
            <option key={value} value={value === "featured" ? "" : value}>
              {t(`sorts.${value}`)}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
