"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export const inputClass =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm aria-[invalid=true]:border-red-600";
export const textareaClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm aria-[invalid=true]:border-red-600";

type Props = {
  label: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
};

/** حقل بعنوان ورسالة خطأ مترجمة (مفتاح الخطأ من Zod → AdminProducts.errors). */
export function Field({ label, error, hint, children }: Props) {
  const t = useTranslations("AdminProducts.errors");
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
      })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-red-700">
          {t.has(error) ? t(error) : t("generic")}
        </p>
      )}
    </div>
  );
}
