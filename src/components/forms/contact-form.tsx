"use client";

import { useCallback, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { submitContact } from "@/server/actions/orders";
import {
  contactInputSchema,
  type ContactFormValues,
  type ContactInput,
} from "@/validators/order";
import { areaClass, fieldClass, FormField } from "./form-field";
import { Turnstile } from "./turnstile";

export function ContactForm() {
  const t = useTranslations("Contact");
  const tc = useTranslations("Consent");
  const ts = useTranslations("Site");
  const locale = useLocale() as "ar" | "en";
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();
  const [token, setToken] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<ContactFormValues, unknown, ContactInput>({
    resolver: zodResolver(contactInputSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      marketingConsent: false,
      locale,
    },
  });
  const { register, handleSubmit, setError, setValue, getValues, formState } =
    form;
  const errors = formState.errors;
  const onToken = useCallback(
    (value: string | undefined) => setToken(value),
    [],
  );

  useEffect(() => {
    if (!session?.user) return;
    if (!getValues("name") && session.user.name)
      setValue("name", session.user.name);
    if (!getValues("email") && session.user.email)
      setValue("email", session.user.email);
  }, [session, getValues, setValue]);

  const onSubmit = handleSubmit(() => {
    // نرسل القيم الخام: الخادم يعيد التحقق ويطبّع بنفسه (قيم المحوّل في العميل ليست مدخلاً صالحاً له)
    const values = getValues();
    setFormError(null);
    startTransition(async () => {
      const result = await submitContact({
        ...values,
        locale,
        turnstileToken: token,
      });
      if (result.ok) return setSent(true);
      setResetKey((n) => n + 1);
      if (result.error === "VALIDATION" && result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors))
          setError(field as keyof ContactFormValues, { message });
        return;
      }
      if (result.error === "RATE_LIMIT") {
        return setFormError(
          t("errors.RATE_LIMIT", {
            minutes: Math.max(
              1,
              Math.ceil((result.retryAfterSec ?? 3600) / 60),
            ),
          }),
        );
      }
      setFormError(
        t.has(`errors.${result.error}`)
          ? t(`errors.${result.error}`)
          : t("errors.FAILED"),
      );
    });
  });

  if (sent) {
    return (
      <div
        role="status"
        className="border-border space-y-2 rounded-xl border p-6 text-center"
      >
        <h2 className="text-xl font-bold">{t("sentTitle")}</h2>
        <p className="text-muted-foreground">{t("sentBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" {...register("locale")} />
      <FormField label={t("name")} required error={errors.name?.message}>
        {(p) => (
          <input
            {...p}
            autoComplete="name"
            className={fieldClass}
            {...register("name")}
          />
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={t("email")}
          error={errors.email?.message}
          hint={t("contactHint")}
        >
          {(p) => (
            <input
              {...p}
              type="email"
              dir="ltr"
              autoComplete="email"
              className={`${fieldClass} text-start`}
              {...register("email")}
            />
          )}
        </FormField>
        <FormField
          label={t("phone")}
          error={errors.phone?.message}
          hint={t("phoneHint")}
        >
          {(p) => (
            <input
              {...p}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="+962 7X XXX XXXX"
              className={`${fieldClass} text-start`}
              {...register("phone")}
            />
          )}
        </FormField>
      </div>
      <FormField label={t("subject")} required error={errors.subject?.message}>
        {(p) => (
          <input {...p} className={fieldClass} {...register("subject")} />
        )}
      </FormField>
      <FormField label={t("message")} required error={errors.message?.message}>
        {(p) => (
          <textarea
            {...p}
            rows={5}
            className={areaClass}
            {...register("message")}
          />
        )}
      </FormField>
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            aria-invalid={!!errors.marketingConsent}
            {...register("marketingConsent")}
          />
          <span>{tc("marketing", { siteName: ts("name") })}</span>
        </label>
        {errors.marketingConsent && (
          <p role="alert" className="text-xs text-red-700">
            {t(`errors.${errors.marketingConsent.message}`)}
          </p>
        )}
      </div>
      <Turnstile onToken={onToken} resetKey={resetKey} />
      {formError && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {formError}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
