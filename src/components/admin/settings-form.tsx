"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { saveSiteSettings } from "@/server/actions/admin/settings";
import { siteSettingsSchema, type SiteSettings } from "@/validators/settings";
import { Field, inputClass, textareaClass } from "./field";
import { RowControls } from "./row-controls";
import { useDragReorder } from "./use-drag-reorder";

const SOCIAL = [
  "facebook",
  "instagram",
  "x",
  "youtube",
  "linkedin",
  "telegram",
] as const;
const msg = (e: { message?: string } | undefined) => e?.message;
const section = "text-lg font-semibold";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const t = useTranslations("AdminSettings");
  const tp = useTranslations("AdminProducts");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SiteSettings>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initial,
  });
  const { register, control, handleSubmit, setError, formState } = form;
  const errors = formState.errors as FieldErrors<SiteSettings>;
  const whyUs = useFieldArray({ control, name: "whyUs" });
  const drag = useDragReorder(whyUs.move);

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    setFormError(null);
    startTransition(async () => {
      const result = await saveSiteSettings(values);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else if (result.error === "invalidPhone")
        setError("contact.whatsapp", { message: "invalidPhone" });
      else setFormError(tp("errors.generic"));
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      <section className="space-y-4">
        <h2 className={section}>{t("sections.contact")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("fields.whatsapp")}
            error={msg(errors.contact?.whatsapp)}
            hint={t("hints.whatsapp")}
          >
            {(p) => (
              <input
                {...p}
                type="tel"
                dir="ltr"
                placeholder="+962791234567"
                className={inputClass}
                {...register("contact.whatsapp")}
              />
            )}
          </Field>
          <Field label={t("fields.phone")} error={msg(errors.contact?.phone)}>
            {(p) => (
              <input
                {...p}
                type="tel"
                dir="ltr"
                className={inputClass}
                {...register("contact.phone")}
              />
            )}
          </Field>
          <Field label={t("fields.email")} error={msg(errors.contact?.email)}>
            {(p) => (
              <input
                {...p}
                type="email"
                dir="ltr"
                className={inputClass}
                {...register("contact.email")}
              />
            )}
          </Field>
          <Field
            label={t("fields.notificationEmail")}
            error={msg(errors.notifications?.email)}
            hint={t("hints.notificationEmail")}
          >
            {(p) => (
              <input
                {...p}
                type="email"
                dir="ltr"
                className={inputClass}
                {...register("notifications.email")}
              />
            )}
          </Field>
          <Field
            label={`${t("fields.workingHours")} (${tp("tabs.ar")})`}
            error={msg(errors.contact?.workingHoursAr)}
          >
            {(p) => (
              <input
                {...p}
                className={inputClass}
                {...register("contact.workingHoursAr")}
              />
            )}
          </Field>
          <Field
            label={`${t("fields.workingHours")} (${tp("tabs.en")})`}
            error={msg(errors.contact?.workingHoursEn)}
          >
            {(p) => (
              <input
                {...p}
                dir="ltr"
                className={inputClass}
                {...register("contact.workingHoursEn")}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={section}>{t("sections.social")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL.map((key) => (
            <Field
              key={key}
              label={t(`social.${key}`)}
              error={msg(errors.contact?.social?.[key])}
            >
              {(p) => (
                <input
                  {...p}
                  type="url"
                  dir="ltr"
                  placeholder="https://…"
                  className={inputClass}
                  {...register(`contact.social.${key}`)}
                />
              )}
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={section}>{t("sections.whyUs")}</h2>
        <p className="text-muted-foreground text-sm">{t("hints.whyUs")}</p>
        {whyUs.fields.map((row, index) => (
          <div
            key={row.id}
            className="border-border space-y-3 rounded-lg border p-4"
            {...drag(index)}
          >
            <div className="flex justify-end">
              <RowControls
                index={index}
                count={whyUs.fields.length}
                onMove={whyUs.move}
                onRemove={() => whyUs.remove(index)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={`${t("fields.whyTitle")} (${tp("tabs.ar")})`}
                error={msg(errors.whyUs?.[index]?.ar?.title)}
              >
                {(p) => (
                  <input
                    {...p}
                    className={inputClass}
                    {...register(`whyUs.${index}.ar.title`)}
                  />
                )}
              </Field>
              <Field label={`${t("fields.whyTitle")} (${tp("tabs.en")})`}>
                {(p) => (
                  <input
                    {...p}
                    dir="ltr"
                    className={inputClass}
                    {...register(`whyUs.${index}.en.title`)}
                  />
                )}
              </Field>
              <Field label={`${t("fields.whyDescription")} (${tp("tabs.ar")})`}>
                {(p) => (
                  <textarea
                    {...p}
                    rows={2}
                    className={textareaClass}
                    {...register(`whyUs.${index}.ar.description`)}
                  />
                )}
              </Field>
              <Field label={`${t("fields.whyDescription")} (${tp("tabs.en")})`}>
                {(p) => (
                  <textarea
                    {...p}
                    dir="ltr"
                    rows={2}
                    className={textareaClass}
                    {...register(`whyUs.${index}.en.description`)}
                  />
                )}
              </Field>
            </div>
          </div>
        ))}
        {whyUs.fields.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              whyUs.append({
                ar: { title: "", description: "" },
                en: { title: "", description: "" },
              })
            }
          >
            <Plus className="size-4" aria-hidden />
            {t("add.whyUs")}
          </Button>
        )}
      </section>

      <div className="border-border bg-background sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t px-4 py-3">
        <Button type="submit" disabled={pending}>
          {pending ? tp("saving") : tp("save")}
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
