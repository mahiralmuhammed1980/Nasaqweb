"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Tab = "ALL" | "EXE" | "SAAS" | "APK";
type Item = { id: string; type: "EXE" | "SAAS" | "APK"; node: ReactNode };

/** تبويبات النوع في الرئيسية: العناصر مُصيَّرة من الخادم والتبويب يرشّحها فقط. */
export function FeaturedTabs({ items }: { items: Item[] }) {
  const t = useTranslations("Home");
  const types = useTranslations("Products.types");
  const [tab, setTab] = useState<Tab>("ALL");
  const tabs: Tab[] = ["ALL", "EXE", "SAAS", "APK"];
  const visible =
    tab === "ALL" ? items : items.filter((item) => item.type === tab);

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("tabsLabel")}
        className="flex flex-wrap gap-2"
      >
        {tabs.map((value) => (
          <button
            key={value}
            role="tab"
            type="button"
            id={`tab-${value}`}
            aria-selected={tab === value}
            aria-controls="featured-panel"
            onClick={() => setTab(value)}
            className={cn(
              "h-9 rounded-full border px-4 text-sm font-medium",
              tab === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {value === "ALL" ? t("allTypes") : types(value)}
          </button>
        ))}
      </div>
      <div
        id="featured-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mt-6"
      >
        {visible.length === 0 ? (
          <p className="text-muted-foreground">{t("noFeatured")}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <li key={item.id}>{item.node}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
