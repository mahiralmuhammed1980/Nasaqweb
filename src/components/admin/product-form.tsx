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
import { FEATURE_ICON_NAMES } from "@/lib/feature-icons";
import { saveProduct } from "@/server/actions/admin/products";
import {
  productSchema,
  type ProductFormValues,
  type ProductInput,
} from "@/validators/product";
import { Field, inputClass, textareaClass } from "./field";
import { ImageField } from "./image-field";
import { RowControls } from "./row-controls";
import { useDragReorder } from "./use-drag-reorder";

type CategoryOption = { id: string; name: string };
type Props = {
  initial: ProductFormValues;
  categories: CategoryOption[];
  previewHref?: string;
};

const msg = (error: { message?: string } | undefined) => error?.message;
const rowClass = "space-y-3 rounded-lg border border-border p-4";
const sectionTitle = "text-lg font-semibold";

export function ProductForm({ initial, categories, previewHref }: Props) {
  const t = useTranslations("AdminProducts");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"ar" | "en">("ar");

  const form = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: initial,
  });
  const { register, control, handleSubmit, setError, formState } = form;
  const errors = formState.errors as FieldErrors<ProductFormValues>;

  const features = useFieldArray({ control, name: "features" });
  const media = useFieldArray({ control, name: "media" });
  const plans = useFieldArray({ control, name: "plans" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const dragFeature = useDragReorder(features.move);
  const dragMedia = useDragReorder(media.move);
  const dragPlan = useDragReorder(plans.move);
  const dragFaq = useDragReorder(faqs.move);

  const type = useWatch({ control, name: "type" });
  const priceType = useWatch({ control, name: "priceType" });
  const isEdit = Boolean(initial.id);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveProduct({ ...values, id: initial.id });
      if (result.ok) {
        setSaved(true);
        if (!isEdit) router.replace(`/admin/products/${result.data.id}`);
        else router.refresh();
        return;
      }
      if (result.error === "SLUG_TAKEN")
        setError("slug", { message: "slugTaken" });
      else
        setFormError(
          t.has(`errors.${result.error}`)
            ? t(`errors.${result.error}`)
            : t("errors.generic"),
        );
    });
  });

  const locales = [
    { key: "ar" as const, label: t("tabs.ar") },
    { key: "en" as const, label: t("tabs.en") },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      {/* ===== الأساسيات ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.basic")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("fields.slug")}
            error={msg(errors.slug)}
            hint={t("hints.slug")}
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
          <Field label={t("fields.type")} error={msg(errors.type)}>
            {(p) => (
              <select {...p} className={inputClass} {...register("type")}>
                {(["EXE", "SAAS", "APK"] as const).map((v) => (
                  <option key={v} value={v}>
                    {t(`types.${v}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("fields.status")} error={msg(errors.status)}>
            {(p) => (
              <select {...p} className={inputClass} {...register("status")}>
                {(["DRAFT", "PUBLISHED", "ARCHIVED"] as const).map((v) => (
                  <option key={v} value={v}>
                    {t(`status.${v}`)}
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
                <option value="">{t("noCategory")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            label={t("fields.platforms")}
            error={msg(errors.platforms)}
            hint={t("hints.platforms")}
          >
            {(p) => (
              <input {...p} className={inputClass} {...register("platforms")} />
            )}
          </Field>
          <Field label={t("fields.version")} error={msg(errors.version)}>
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("version")}
              />
            )}
          </Field>
          <Field label={t("fields.sortOrder")} error={msg(errors.sortOrder)}>
            {(p) => (
              <input
                {...p}
                type="number"
                className={inputClass}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            )}
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" {...register("featured")} />
            {t("fields.featured")}
          </label>
        </div>
      </section>

      {/* ===== السعر ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.price")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("fields.priceType")} error={msg(errors.priceType)}>
            {(p) => (
              <select {...p} className={inputClass} {...register("priceType")}>
                {(["FIXED", "FROM", "ON_REQUEST"] as const).map((v) => (
                  <option key={v} value={v}>
                    {t(`priceTypes.${v}`)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {priceType !== "ON_REQUEST" && (
            <Field label={t("fields.price")} error={msg(errors.price)}>
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
          <Field label={t("fields.currency")} error={msg(errors.currency)}>
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

      {/* ===== الغلاف ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.cover")}</h2>
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageField
              label={t("fields.coverImage")}
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.coverImage}
            />
          )}
        />
        {errors.coverImage && (
          <p role="alert" className="text-xs text-red-700">
            {t(`errors.${msg(errors.coverImage) ?? "generic"}`)}
          </p>
        )}
      </section>

      {/* ===== الترجمات ===== */}
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
            <Field label={t("fields.name")} error={msg(errors[l.key]?.name)}>
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  {...register(`${l.key}.name`)}
                />
              )}
            </Field>
            <Field
              label={t("fields.tagline")}
              error={msg(errors[l.key]?.tagline)}
            >
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  {...register(`${l.key}.tagline`)}
                />
              )}
            </Field>
            <Field
              label={t("fields.description")}
              error={msg(errors[l.key]?.description)}
              hint={t("hints.markdown")}
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={8}
                  className={textareaClass}
                  {...register(`${l.key}.description`)}
                />
              )}
            </Field>
            <Field
              label={t("fields.seoTitle")}
              error={msg(errors[l.key]?.seoTitle)}
            >
              {(p) => (
                <input
                  {...p}
                  className={inputClass}
                  {...register(`${l.key}.seoTitle`)}
                />
              )}
            </Field>
            <Field
              label={t("fields.seoDescription")}
              error={msg(errors[l.key]?.seoDescription)}
            >
              {(p) => (
                <textarea
                  {...p}
                  rows={2}
                  className={textareaClass}
                  {...register(`${l.key}.seoDescription`)}
                />
              )}
            </Field>
          </div>
        ))}
        <p className="text-muted-foreground text-xs">
          {t("hints.englishOptional")}
        </p>
      </section>

      {/* ===== المعاينة والفيديو ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.demo")}</h2>
        {type === "SAAS" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("fields.demoUrl")}
              error={msg(errors.demoUrl)}
              hint={t("hints.demoUrl")}
            >
              {(p) => (
                <input
                  {...p}
                  dir="ltr"
                  className={inputClass}
                  {...register("demoUrl")}
                />
              )}
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <input type="checkbox" {...register("demoEmbeddable")} />
              {t("fields.demoEmbeddable")}
            </label>
            <Field
              label={t("fields.demoUsername")}
              error={msg(errors.demoUsername)}
            >
              {(p) => (
                <input
                  {...p}
                  dir="ltr"
                  className={inputClass}
                  {...register("demoUsername")}
                />
              )}
            </Field>
            <Field
              label={t("fields.demoPassword")}
              error={msg(errors.demoPassword)}
            >
              {(p) => (
                <input
                  {...p}
                  dir="ltr"
                  className={inputClass}
                  {...register("demoPassword")}
                />
              )}
            </Field>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("fields.videoProvider")}
            error={msg(errors.videoProvider)}
          >
            {(p) => (
              <select
                {...p}
                className={inputClass}
                {...register("videoProvider", {
                  setValueAs: (v: string) => (v === "" ? null : v),
                })}
              >
                <option value="">{t("noVideo")}</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="BUNNY">Bunny</option>
              </select>
            )}
          </Field>
          <Field
            label={t("fields.videoId")}
            error={msg(errors.videoId)}
            hint={t("hints.videoId")}
          >
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("videoId")}
              />
            )}
          </Field>
          <Field
            label={t("fields.trialDownloadUrl")}
            error={msg(errors.trialDownloadUrl)}
          >
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("trialDownloadUrl")}
              />
            )}
          </Field>
        </div>
      </section>

      {/* ===== الميزات ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.features")}</h2>
        {features.fields.map((row, index) => (
          <div key={row.id} className={rowClass} {...dragFeature(index)}>
            <div className="flex items-center justify-between gap-2">
              <Field
                label={t("fields.icon")}
                error={msg(errors.features?.[index]?.icon)}
              >
                {(p) => (
                  <select
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`features.${index}.icon`)}
                  >
                    {FEATURE_ICON_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <RowControls
                index={index}
                count={features.fields.length}
                onMove={features.move}
                onRemove={() => features.remove(index)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${t("fields.title")} (${t("tabs.ar")})`}
                error={msg(errors.features?.[index]?.ar?.title)}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`features.${index}.ar.title`)}
                  />
                )}
              </Field>
              <Field
                label={`${t("fields.title")} (${t("tabs.en")})`}
                error={msg(errors.features?.[index]?.en?.title)}
              >
                {(p) => (
                  <input
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`features.${index}.en.title`)}
                  />
                )}
              </Field>
              <Field
                label={`${t("fields.shortDescription")} (${t("tabs.ar")})`}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`features.${index}.ar.description`)}
                  />
                )}
              </Field>
              <Field
                label={`${t("fields.shortDescription")} (${t("tabs.en")})`}
              >
                {(p) => (
                  <input
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`features.${index}.en.description`)}
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
          onClick={() =>
            features.append({
              icon: FEATURE_ICON_NAMES[0] ?? "Star",
              ar: { title: "", description: "" },
              en: { title: "", description: "" },
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          {t("add.feature")}
        </Button>
      </section>

      {/* ===== الصور ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.media")}</h2>
        {media.fields.map((row, index) => (
          <div key={row.id} className={rowClass} {...dragMedia(index)}>
            <div className="flex items-start justify-between gap-2">
              <Controller
                control={control}
                name={`media.${index}.url`}
                render={({ field }) => (
                  <ImageField
                    label={t("fields.screenshot")}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.media?.[index]?.url}
                  />
                )}
              />
              <RowControls
                index={index}
                count={media.fields.length}
                onMove={media.move}
                onRemove={() => media.remove(index)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${t("fields.alt")} (${t("tabs.ar")})`}
                error={msg(errors.media?.[index]?.altAr)}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`media.${index}.altAr`)}
                  />
                )}
              </Field>
              <Field
                label={`${t("fields.alt")} (${t("tabs.en")})`}
                error={msg(errors.media?.[index]?.altEn)}
              >
                {(p) => (
                  <input
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`media.${index}.altEn`)}
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
          onClick={() => media.append({ url: "", altAr: "", altEn: "" })}
        >
          <Plus className="size-4" aria-hidden />
          {t("add.media")}
        </Button>
      </section>

      {/* ===== الخطط ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.plans")}</h2>
        {plans.fields.map((row, index) => (
          <div key={row.id} className={rowClass} {...dragPlan(index)}>
            <div className="flex items-center justify-between gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <Field
                  label={t("fields.price")}
                  error={msg(errors.plans?.[index]?.price)}
                >
                  {(p) => (
                    <input
                      {...p}
                      type="number"
                      step="0.01"
                      className={inputClass}
                      {...register(`plans.${index}.price`, {
                        valueAsNumber: true,
                      })}
                    />
                  )}
                </Field>
                <Field label={t("fields.billingPeriod")}>
                  {(p) => (
                    <select
                      {...p}
                      className={inputClass}
                      {...register(`plans.${index}.billingPeriod`)}
                    >
                      {(["ONE_TIME", "MONTHLY", "YEARLY"] as const).map((v) => (
                        <option key={v} value={v}>
                          {t(`billing.${v}`)}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    {...register(`plans.${index}.highlighted`)}
                  />
                  {t("fields.highlighted")}
                </label>
              </div>
              <RowControls
                index={index}
                count={plans.fields.length}
                onMove={plans.move}
                onRemove={() => plans.remove(index)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <Field
                  label={`${t("fields.planName")} (${t("tabs.ar")})`}
                  error={msg(errors.plans?.[index]?.ar?.name)}
                >
                  {(p) => (
                    <input
                      {...p}
                      className={inputClass}
                      {...register(`plans.${index}.ar.name`)}
                    />
                  )}
                </Field>
                <Field
                  label={`${t("fields.planFeatures")} (${t("tabs.ar")})`}
                  hint={t("hints.planFeatures")}
                >
                  {(p) => (
                    <textarea
                      {...p}
                      rows={4}
                      className={textareaClass}
                      {...register(`plans.${index}.ar.featuresText`)}
                    />
                  )}
                </Field>
              </div>
              <div className="space-y-3">
                <Field
                  label={`${t("fields.planName")} (${t("tabs.en")})`}
                  error={msg(errors.plans?.[index]?.en?.name)}
                >
                  {(p) => (
                    <input
                      {...p}
                      dir="ltr"
                      className={inputClass}
                      {...register(`plans.${index}.en.name`)}
                    />
                  )}
                </Field>
                <Field
                  label={`${t("fields.planFeatures")} (${t("tabs.en")})`}
                  hint={t("hints.planFeatures")}
                >
                  {(p) => (
                    <textarea
                      {...p}
                      dir="ltr"
                      rows={4}
                      className={textareaClass}
                      {...register(`plans.${index}.en.featuresText`)}
                    />
                  )}
                </Field>
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            plans.append({
              price: 0,
              billingPeriod: "MONTHLY",
              highlighted: false,
              ar: { name: "", featuresText: "" },
              en: { name: "", featuresText: "" },
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          {t("add.plan")}
        </Button>
      </section>

      {/* ===== الأسئلة الشائعة ===== */}
      <section className="space-y-4">
        <h2 className={sectionTitle}>{t("sections.faqs")}</h2>
        {faqs.fields.map((row, index) => (
          <div key={row.id} className={rowClass} {...dragFaq(index)}>
            <div className="flex justify-end">
              <RowControls
                index={index}
                count={faqs.fields.length}
                onMove={faqs.move}
                onRemove={() => faqs.remove(index)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${t("fields.question")} (${t("tabs.ar")})`}
                error={msg(errors.faqs?.[index]?.ar?.question)}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`faqs.${index}.ar.question`)}
                  />
                )}
              </Field>
              <Field label={`${t("fields.question")} (${t("tabs.en")})`}>
                {(p) => (
                  <input
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`faqs.${index}.en.question`)}
                  />
                )}
              </Field>
              <Field
                label={`${t("fields.answer")} (${t("tabs.ar")})`}
                error={msg(errors.faqs?.[index]?.ar?.answer)}
              >
                {(p) => (
                  <textarea
                    {...p}
                    rows={3}
                    className={textareaClass}
                    {...register(`faqs.${index}.ar.answer`)}
                  />
                )}
              </Field>
              <Field label={`${t("fields.answer")} (${t("tabs.en")})`}>
                {(p) => (
                  <textarea
                    {...p}
                    dir="ltr"
                    rows={3}
                    className={textareaClass}
                    {...register(`faqs.${index}.en.answer`)}
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
          onClick={() =>
            faqs.append({
              ar: { question: "", answer: "" },
              en: { question: "", answer: "" },
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          {t("add.faq")}
        </Button>
      </section>

      {/* ===== الحفظ ===== */}
      <div className="border-border bg-background sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t px-4 py-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        {previewHref && (
          <Button asChild variant="outline">
            <Link href={previewHref}>{t("preview")}</Link>
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link href="/admin/products">{t("backToList")}</Link>
        </Button>
        {saved && (
          <p role="status" className="text-sm text-green-700">
            {t("saved")}
          </p>
        )}
        {formError && (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-red-700">
            {t("errors.fixFields")}
          </p>
        )}
      </div>
    </form>
  );
}
