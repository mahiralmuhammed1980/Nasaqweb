"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export const fieldClass =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm aria-[invalid=true]:border-red-600";
export const areaClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm aria-[invalid=true]:border-red-600";

type Props = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    "aria-required"?: boolean;
  }) => ReactNode;
};

/** حقل نموذج عام: عنوان + رسالة خطأ مترجمة من PublicForm.errors (مفتاح الخطأ يأتي من Zod/الخادم). */
export function FormField({ label, error, hint, required, children }: Props) {
  const t = useTranslations("PublicForm");
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && (
          <span aria-hidden className="ms-1 text-red-700">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
        "aria-required": required,
      })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-red-700">
          {t.has(`errors.${error}`)
            ? t(`errors.${error}`)
            : t("errors.generic")}
        </p>
      )}
    </div>
  );
}
