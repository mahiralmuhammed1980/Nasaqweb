"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { fromLocalInput, toLocalInput } from "@/lib/datetime";
import { saveOffer } from "@/server/actions/admin/offers";
import {
  offerFormSchema,
  type OfferFormValues,
  type OfferInput,
} from "@/validators/offer";
import { Field, inputClass, textareaClass } from "./field";
import { ImageField } from "./image-field";
import { ProductMultiSelect } from "./product-multi-select";

type Props = {
  initial: OfferFormValues;
  products: { id: string; name: string }[];
};

const msg = (error: { message?: string } | undefined) => error?.message;
const sectionTitle = "text-lg font-semibold";

export function OfferForm({ initial, products }: Props) {
  const t = useTranslations("AdminOffers");
  const tp = useTranslations("AdminProducts");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"ar" | "en">("ar");
  const isEdit = Boolean(initial.id);

  const form = useForm<OfferFormValues, unknown, OfferInput>({
    resolver: zodResolver(offerFormSchema),
    // التواريخ تصل ISO من الخادم وتُعرض بتوقيت المتصفح (النموذج مُصيَّر داخل ClientOnly)
    defaultValues: {
      ...initial,
      startsAt: toLocalInput(initial.startsAt),
      endsAt: toLocalInput(initial.endsAt),
    },
  });
  const { register, control, handleSubmit, setError, formState } = form;
  const errors = formState.errors as FieldErrors<OfferFormValues>;
  const discountType = useWatch({ control, name: "discountType" });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setSaved(false);
    startTransition(async () => {
      // الحقول المحلية (datetime-local) تُحوَّل إلى ISO بـ UTC قبل الإرسال
      const result = await saveOffer({
        ...values,
        id: initial.id,
        startsAt: fromLocalInput(values.startsAt),
        endsAt: fromLocalInput(values.endsAt),
      });
      if (result.ok) {
        setSaved(true);
        if (!isEdit) router.replace(`/admin/offers/${result.data.id}`);
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
          <Field
            label={t("fields.couponCode")}
            error={msg(errors.couponCode)}
            hint={t("hints.coupon")}
          >
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("couponCode")}
              />
            )}
          </Field>
          <Field
            label={t("fields.discountType")}
            error={msg(errors.discountType)}
          >
            {(p) => (
              <select
                {...p}
                className={inputClass}
                {...register("discountType")}
              >
                <option value="PERCENT">{t("discountTypes.PERCENT")}</option>
                <option value="FIXED">{t("discountTypes.FIXED")}</option>
              </select>
            )}
          </Field>
          <Field
            label={
              discountType === "PERCENT"
                ? t("fields.discountPercent")
                : t("fields.discountAmount")
            }
            error={msg(errors.discountValue)}
          >
            {(p) => (
              <input
                {...p}
                type="number"
                step="0.01"
                className={inputClass}
                {...register("discountValue", { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field
            label={t("fields.startsAt")}
            error={msg(errors.startsAt)}
            hint={t("hints.localTime")}
          >
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                dir="ltr"
                className={inputClass}
                {...register("startsAt")}
              />
            )}
          </Field>
          <Field
            label={t("fields.endsAt")}
            error={msg(errors.endsAt)}
            hint={t("hints.localTime")}
          >
            {(p) => (
              <input
                {...p}
                type="datetime-local"
                dir="ltr"
                className={inputClass}
                {...register("endsAt")}
              />
            )}
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} />
            {t("fields.isActive")}
          </label>
        </div>
        <Controller
          control={control}
          name="bannerImage"
          render={({ field }) => (
            <ImageField
              label={t("fields.bannerImage")}
              value={field.value ?? ""}
              onChange={field.onChange}
              invalid={!!errors.bannerImage}
            />
          )}
        />
        {errors.bannerImage && (
          <p role="alert" className="text-xs text-red-700">
            {tp(`errors.${msg(errors.bannerImage) ?? "generic"}`)}
          </p>
        )}
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
            <Field label={t("fields.title")} error={msg(errors[l.key]?.title)}>
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  {...register(`${l.key}.title`)}
                />
              )}
            </Field>
            <Field
              label={t("fields.description")}
              error={msg(errors[l.key]?.description)}
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={3}
                  className={textareaClass}
                  {...register(`${l.key}.description`)}
                />
              )}
            </Field>
            <Field
              label={t("fields.terms")}
              error={msg(errors[l.key]?.terms)}
              hint={tp("hints.markdown")}
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={5}
                  className={textareaClass}
                  {...register(`${l.key}.terms`)}
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
        <h2 className={sectionTitle}>{t("sections.products")}</h2>
        <Controller
          control={control}
          name="productIds"
          render={({ field }) => (
            <ProductMultiSelect
              label={t("fields.products")}
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
          <Link href="/admin/offers">{tp("backToList")}</Link>
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
