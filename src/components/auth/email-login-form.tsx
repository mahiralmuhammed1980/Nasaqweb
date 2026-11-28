"use client";

import { useCallback, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { requestMagicLink } from "@/server/actions/auth";
import { Turnstile } from "@/components/forms/turnstile";
import { emailSchema, type EmailFormValues } from "@/validators/auth";

export function EmailLoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations("Login");
  const locale = useLocale() as "ar" | "en";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [resetKey, setResetKey] = useState(0);
  const onToken = useCallback(
    (value: string | undefined) => setToken(value),
    [],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await requestMagicLink({
        email: values.email,
        callbackUrl,
        locale,
        turnstileToken: token,
      });
      if (result.ok) return router.push("/login/verify");
      setResetKey((n) => n + 1);
      setServerError(
        result.error === "RATE_LIMIT"
          ? t("errors.RATE_LIMIT", {
              minutes: Math.max(
                1,
                Math.ceil((result.retryAfterSec ?? 3600) / 60),
              ),
            })
          : t(`errors.${result.error}`),
      );
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <label htmlFor="email" className="block text-sm font-medium">
        {t("emailLabel")}
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? "email-error" : undefined}
        className="border-border bg-background h-10 w-full rounded-md border px-3 text-start"
        {...register("email")}
      />
      {errors.email && (
        <p id="email-error" role="alert" className="text-sm text-red-700">
          {t("errors.invalidEmail")}
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-sm text-red-700">
          {serverError}
        </p>
      )}
      <Turnstile onToken={onToken} resetKey={resetKey} />
      <Button type="submit" className="w-full" disabled={pending}>
        {t("sendLink")}
      </Button>
    </form>
  );
}
