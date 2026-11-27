"use client";

import { useTranslations } from "next-intl";

type Option = { id: string; name: string };

/** اختيار منتجات متعددة بخانات اختيار (للعروض وللتوافق مع الأجهزة) */
export function ProductMultiSelect({
  options,
  value,
  onChange,
  label,
}: {
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const t = useTranslations("AdminOffers");
  const selected = new Set(value);
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      {options.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("noProducts")}</p>
      ) : (
        <ul className="border-border grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(option.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(option.id);
                    else next.delete(option.id);
                    onChange([...next]);
                  }}
                />
                {option.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
