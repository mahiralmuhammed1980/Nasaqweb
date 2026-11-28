"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { whatsappUrl } from "@/lib/whatsapp";
import { submitOrder } from "@/server/actions/orders";
import {
  orderInputSchema,
  type OrderFormValues,
  type OrderInput,
} from "@/validators/order";
import { areaClass, fieldClass, FormField } from "./form-field";
import { Turnstile } from "./turnstile";

export type OrderTarget = {
  kind: "product" | "hardware";
  slug: string;
  name: string;
};
export type PlanOption = { id: string; label: string };

type Props = {
  target: OrderTarget;
  plans?: PlanOption[];
  defaultPlanId?: string;
  /** رقم واتساب الإدارة (من الإعدادات) لزر «تابع عبر واتساب» بعد الإرسال */
  whatsappNumber?: string | null;
};

const CHANNELS = ["WHATSAPP", "PHONE", "EMAIL"] as const;

function readUtm() {
  try {
    return {
      utmSource: sessionStorage.getItem("utm_source") ?? undefined,
      utmMedium: sessionStorage.getItem("utm_medium") ?? undefined,
      utmCampaign: sessionStorage.getItem("utm_campaign") ?? undefined,
    };
  } catch {
    return {};
  }
}

export function OrderForm({
  target,
  plans = [],
  defaultPlanId,
  whatsappNumber,
}: Props) {
  const t = useTranslations("Order");
  const tc = useTranslations("Consent");
  const ts = useTranslations("Site");
  const locale = useLocale() as "ar" | "en";
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();
  const [token, setToken] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const form = useForm<OrderFormValues, unknown, OrderInput>({
    resolver: zodResolver(orderInputSchema),
    defaultValues: {
      productSlug: target.kind === "product" ? target.slug : undefined,
      hardwareSlug: target.kind === "hardware" ? target.slug : undefined,
      planId: defaultPlanId ?? "",
      name: "",
      phone: "",
      phoneHasWhatsapp: false,
      email: "",
      company: "",
      city: "",
      country: "",
      preferredChannel: "WHATSAPP",
      message: "",
      marketingConsent: false, // غير محددة مسبقاً
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

  // المستخدم المسجّل: تعبئة تلقائية (لا نكتب فوق ما كتبه الزائر)
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
      const result = await submitOrder({
        ...values,
        planId: values.planId || undefined,
        locale,
        referrer: pathname
          ? `/${locale}${pathname === "/" ? "" : pathname}`
          : undefined,
        turnstileToken: token,
        ...readUtm(),
      });
      if (result.ok) return setDone(result.number);
      setResetKey((n) => n + 1);
      if (result.error === "VALIDATION" && result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof OrderFormValues, { message });
        }
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

  if (done !== null) {
    const wa = whatsappUrl(
      whatsappNumber,
      t("whatsappFollowUp", { number: done }),
    );
    return (
      <div role="status" className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">{t("thanksTitle")}</h2>
        <p>
          {t("thanksNumber")} <strong data-testid="order-number">{done}</strong>
        </p>
        <p className="text-muted-foreground">{t("thanksBody")}</p>
        {wa && (
          <Button asChild>
            <a href={wa} target="_blank" rel="noopener noreferrer">
              {t("continueOnWhatsapp")}
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input type="hidden" {...register("locale")} />
      <p className="bg-muted rounded-md p-3 text-sm">
        <span className="text-muted-foreground">{t("about")}</span>{" "}
        <strong>{target.name}</strong>
      </p>
      {errors.productSlug && (
        <p role="alert" className="text-xs text-red-700">
          {t("errors.targetRequired")}
        </p>
      )}

      {plans.length > 0 && (
        <FormField label={t("plan")} error={errors.planId?.message}>
          {(p) => (
            <select {...p} className={fieldClass} {...register("planId")}>
              <option value="">{t("noPlan")}</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}

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

      <FormField
        label={t("phone")}
        required
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("phoneHasWhatsapp")} />
        {t("phoneHasWhatsapp")}
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          {t("preferredChannel")}
          <span aria-hidden className="ms-1 text-red-700">
            *
          </span>
        </legend>
        <div className="flex flex-wrap gap-4">
          {CHANNELS.map((channel) => (
            <label key={channel} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                value={channel}
                {...register("preferredChannel")}
              />
              {t(`channels.${channel}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField
        label={t("email")}
        error={errors.email?.message}
        hint={t("emailHint")}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("company")} error={errors.company?.message}>
          {(p) => (
            <input
              {...p}
              autoComplete="organization"
              className={fieldClass}
              {...register("company")}
            />
          )}
        </FormField>
        <FormField label={t("city")} error={errors.city?.message}>
          {(p) => <input {...p} className={fieldClass} {...register("city")} />}
        </FormField>
      </div>
      <FormField label={t("country")} error={errors.country?.message}>
        {(p) => (
          <input
            {...p}
            autoComplete="country-name"
            className={fieldClass}
            {...register("country")}
          />
        )}
      </FormField>

      <FormField label={t("message")} error={errors.message?.message}>
        {(p) => (
          <textarea
            {...p}
            rows={3}
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
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
