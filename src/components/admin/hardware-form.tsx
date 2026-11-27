"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { saveHardware } from "@/server/actions/admin/hardware";
import {
  hardwareSchema,
  type HardwareFormValues,
  type HardwareInput,
} from "@/validators/hardware";
import { Field, inputClass, textareaClass } from "./field";
import { ImageField } from "./image-field";
import { ProductMultiSelect } from "./product-multi-select";
import { RowControls } from "./row-controls";
import { useDragReorder } from "./use-drag-reorder";

type Props = {
  initial: HardwareFormValues;
  categories: { id: string; name: string }[];
  products: { id: string; name: string }[];
};

const msg = (error: { message?: string } | undefined) => error?.message;
const rowClass = "space-y-3 rounded-lg border border-border p-4";
const sectionTitle = "text-lg font-semibold";

export function HardwareForm({ initial, categories, products }: Props) {
  const t = useTranslations("AdminHardware");
  const tp = useTranslations("AdminProducts");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"ar" | "en">("ar");
  const isEdit = Boolean(initial.id);

  const form = useForm<HardwareFormValues, unknown, HardwareInput>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: initial,
  });
  const { register, control, handleSubmit, setError, formState } = form;
  const errors = formState.errors as FieldErrors<HardwareFormValues>;
  const images = useFieldArray({ control, name: "images" });
  const specs = useFieldArray({ control, name: "specs" });
  const dragImage = useDragReorder(images.move);
  const dragSpec = useDragReorder(specs.move);
  const priceType = useWatch({ control, name: "priceType" });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveHardware({ ...values, id: initial.id });
      if (result.ok) {
        setSaved(true);
        if (!isEdit) router.replace(`/admin/hardware/${result.data.id}`);
        else router.refresh();
        return;
      }
      if (result.error === "SLUG_TAKEN")
        setError("slug", { message: "slugTaken" });
      else
        setFormError(
          tp.has(`errors.${result.error}`)
            ? tp(`errors.${result.error}`)
            : tp("errors.generic"),
        );
    });
  });

  const locales = [
    { key: "ar" as const, label: tp("tabs.ar") },
    { key: "en" as const, label: tp("tabs.en") },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.basic")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={tp("fields.slug")}
            error={msg(errors.slug)}
            hint={tp("hints.slug")}
          >
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("slug")}
              />
            )}
          </Field>
          <Field label={tp("fields.status")} error={msg(errors.status)}>
            {(p) => (
              <select {...p} className={inputClass} {...register("status")}>
                {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((v) => (
                  <option key={v} value={v}>
                    {tp(`status.${v}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("fields.category")} error={msg(errors.categoryId)}>
            {(p) => (
              <select
                {...p}
                className={inputClass}
                {...register("categoryId", {
                  setValueAs: (v: string) => (v === "" ? null : v),
                })}
              >
                <option value="">{tp("noCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" {...register("inStock")} />
            {t("fields.inStock")}
          </label>
          <Field label={t("fields.brand")} error={msg(errors.brand)}>
            {(p) => (
              <input {...p} className={inputClass} {...register("brand")} />
            )}
          </Field>
          <Field label={t("fields.model")} error={msg(errors.model)}>
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("model")}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>{tp("sections.price")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={tp("fields.priceType")} error={msg(errors.priceType)}>
            {(p) => (
              <select {...p} className={inputClass} {...register("priceType")}>
                {(["FIXED", "FROM", "ON_REQUEST"] as const).map((v) => (
                  <option key={v} value={v}>
                    {tp(`priceTypes.${v}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {priceType !== "ON_REQUEST" && (
            <Field label={tp("fields.price")} error={msg(errors.price)}>
              {(p) => (
                <input
                  {...p}
                  type="number"
                  step="0.01"
                  className={inputClass}
                  {...register("price", {
                    setValueAs: (v: string) =>
                      v === "" || v === null ? null : Number(v),
                  })}
                />
              )}
            </Field>
          )}
          <Field label={tp("fields.currency")} error={msg(errors.currency)}>
            {(p) => (
              <input
                {...p}
                dir="ltr"
                maxLength={3}
                className={inputClass}
                {...register("currency")}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.content")}</h2>
        <div
          role="tablist"
          aria-label={t("sections.content")}
          className="flex gap-2"
        >
          {locales.map((l) => (
            <button
              key={l.key}
              type="button"
              role="tab"
              id={`tab-${l.key}`}
              aria-selected={tab === l.key}
              aria-controls={`panel-${l.key}`}
              onClick={() => setTab(l.key)}
              className={`h-9 rounded-full border px-4 text-sm font-medium ${tab === l.key ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {locales.map((l) => (
          <div
            key={l.key}
            id={`panel-${l.key}`}
            role="tabpanel"
            aria-labelledby={`tab-${l.key}`}
            hidden={tab !== l.key}
            className="space-y-4"
            dir={l.key === "ar" ? "rtl" : "ltr"}
          >
            <Field label={tp("fields.name")} error={msg(errors[l.key]?.name)}>
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  {...register(`${l.key}.name`)}
                />
              )}
            </Field>
            <Field
              label={tp("fields.description")}
              error={msg(errors[l.key]?.description)}
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={5}
                  className={textareaClass}
                  {...register(`${l.key}.description`)}
                />
              )}
            </Field>
          </div>
        ))}
        <p className="text-muted-foreground text-xs">
          {tp("hints.englishOptional")}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.images")}</h2>
        {errors.images && !Array.isArray(errors.images) && (
          <p role="alert" className="text-xs text-red-700">
            {tp(
              `errors.${msg(errors.images as { message?: string }) ?? "generic"}`,
            )}
          </p>
        )}
        {images.fields.map((row, index) => (
          <div key={row.id} className={rowClass} {...dragImage(index)}>
            <div className="flex items-start justify-between gap-2">
              <Controller
                control={control}
                name={`images.${index}.url`}
                render={({ field }) => (
                  <ImageField
                    label={t("fields.image")}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.images?.[index]?.url}
                  />
                )}
              />
              <RowControls
                index={index}
                count={images.fields.length}
                onMove={images.move}
                onRemove={() => images.remove(index)}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => images.append({ url: "" })}
        >
          <Plus className="size-4" aria-hidden />
          {t("add.image")}
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.specs")}</h2>
        {specs.fields.map((row, index) => (
          <div key={row.id} className={rowClass} {...dragSpec(index)}>
            <div className="flex justify-end">
              <RowControls
                index={index}
                count={specs.fields.length}
                onMove={specs.move}
                onRemove={() => specs.remove(index)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label={`${t("fields.specKey")} (${tp("tabs.ar")})`}
                error={msg(errors.specs?.[index]?.keyAr)}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`specs.${index}.keyAr`)}
                  />
                )}
              </Field>
              <Field label={`${t("fields.specKey")} (${tp("tabs.en")})`}>
                {(p) => (
                  <input
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`specs.${index}.keyEn`)}
                  />
                )}
              </Field>
              <Field
                label={t("fields.specValue")}
                error={msg(errors.specs?.[index]?.value)}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`specs.${index}.value`)}
                  />
                )}
              </Field>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => specs.append({ keyAr: "", keyEn: "", value: "" })}
        >
          <Plus className="size-4" aria-hidden />
          {t("add.spec")}
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.compatible")}</h2>
        <Controller
          control={control}
          name="productIds"
          render={({ field }) => (
            <ProductMultiSelect
              label={t("fields.compatibleProducts")}
              options={products}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </section>

      <div className="border-border bg-background sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t px-4 py-3">
        <Button type="submit" disabled={pending}>
          {pending ? tp("saving") : tp("save")}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/admin/hardware">{tp("backToList")}</Link>
        </Button>
        {saved && (
          <p role="status" className="text-sm text-green-700">
            {tp("saved")}
          </p>
        )}
        {formError && (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-red-700">
            {tp("errors.fixFields")}
          </p>
        )}
      </div>
    </form>
  );
}
