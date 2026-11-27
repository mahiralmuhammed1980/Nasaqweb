"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

export function HardwareFilters({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const t = useTranslations("Hardware");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("category") ?? "";

  return (
    <div className="max-w-xs">
      <label htmlFor="h-category" className="mb-1 block text-sm font-medium">
        {t("filterCategory")}
      </label>
      <select
        id="h-category"
        value={current}
        onChange={(e) =>
          router.replace(
            e.target.value
              ? `${pathname}?category=${e.target.value}`
              : pathname,
            { scroll: false },
          )
        }
        className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
      >
        <option value="">{t("all")}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
