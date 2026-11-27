"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import {
  deleteCategory,
  saveCategory,
} from "@/server/actions/admin/categories";
import { categorySchema, type CategoryInput } from "@/validators/product";
import { DeleteButton } from "./delete-button";
import { Field, inputClass } from "./field";

export type CategoryRow = {
  id: string;
  slug: string;
  sortOrder: number;
  ar: string;
  en: string;
  products: number;
};

const blank: CategoryInput = {
  slug: "",
  sortOrder: 0,
  ar: { name: "" },
  en: { name: "" },
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const t = useTranslations("AdminCategories");
  const tp = useTranslations("AdminProducts");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | undefined>();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: blank,
  });

  const onSubmit = handleSubmit((values) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveCategory({ ...values, id: editing });
      if (result.ok) {
        reset(blank);
        setEditing(undefined);
        router.refresh();
      } else if (result.error === "SLUG_TAKEN")
        setError("slug", { message: "slugTaken" });
      else setMessage(tp("errors.generic"));
    });
  });

  function startEdit(row: CategoryRow) {
    setEditing(row.id);
    reset({
      slug: row.slug,
      sortOrder: row.sortOrder,
      ar: { name: row.ar },
      en: { name: row.en },
    });
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        noValidate
        className="border-border space-y-4 rounded-lg border p-4"
      >
        <h2 className="text-lg font-semibold">
          {editing ? t("edit") : t("new")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tp("fields.slug")} error={errors.slug?.message}>
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("slug")}
              />
            )}
          </Field>
          <Field
            label={tp("fields.sortOrder")}
            error={errors.sortOrder?.message}
          >
            {(p) => (
              <input
                {...p}
                type="number"
                className={inputClass}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field
            label={`${tp("fields.name")} (${tp("tabs.ar")})`}
            error={errors.ar?.name?.message}
          >
            {(p) => (
              <input {...p} className={inputClass} {...register("ar.name")} />
            )}
          </Field>
          <Field
            label={`${tp("fields.name")} (${tp("tabs.en")})`}
            error={errors.en?.name?.message}
          >
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("en.name")}
              />
            )}
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? tp("saving") : tp("save")}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(undefined);
                reset(blank);
              }}
            >
              {t("cancel")}
            </Button>
          )}
          {message && (
            <p role="alert" className="text-sm text-red-700">
              {message}
            </p>
          )}
        </div>
      </form>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2 text-start">{tp("fields.name")}</th>
              <th className="py-2 text-start">{tp("fields.slug")}</th>
              <th className="py-2 text-start">{t("products")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((row) => (
              <tr key={row.id} className="border-border border-b">
                <td className="py-2">
                  {row.ar}
                  {row.en ? ` / ${row.en}` : ""}
                </td>
                <td className="py-2" dir="ltr">
                  {row.slug}
                </td>
                <td className="py-2">{row.products}</td>
                <td className="flex justify-end gap-2 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(row)}
                  >
                    {t("editAction")}
                  </Button>
                  <DeleteButton
                    id={row.id}
                    action={deleteCategory}
                    confirmText={t("confirmDelete")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
