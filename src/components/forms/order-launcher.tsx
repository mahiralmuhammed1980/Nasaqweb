"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { OrderForm, type OrderTarget, type PlanOption } from "./order-form";

type Props = {
  target: OrderTarget;
  plans?: PlanOption[];
  planId?: string;
  whatsappNumber?: string | null;
  className?: string;
  children: ReactNode;
};

/**
 * زر الطلب: رابط عادي إلى /order (يعمل بلا JavaScript وعلى الجوال بصفحة كاملة)،
 * وعلى سطح المكتب (≥768px) يفتح النموذج في نافذة منبثقة.
 */
export function OrderLauncher({
  target,
  plans,
  planId,
  whatsappNumber,
  className,
  children,
}: Props) {
  const t = useTranslations("Order");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // النموذج يُركَّب عند الفتح فقط: لا Turnstile ولا جلسة لكل زر في الصفحة
  const [open, setOpen] = useState(false);

  const params = new URLSearchParams({ [target.kind]: target.slug });
  if (planId) params.set("plan", planId);
  const href = `/order?${params.toString()}`;

  return (
    <>
      <Link
        href={href}
        className={className}
        onClick={(event) => {
          if (window.matchMedia("(min-width: 768px)").matches) {
            event.preventDefault();
            setOpen(true);
            dialogRef.current?.showModal();
          } else {
            event.preventDefault();
            router.push(href);
          }
        }}
      >
        {children}
      </Link>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-label={t("title")}
        className="border-border bg-background m-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border p-0 backdrop:bg-black/60"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{t("title")}</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dialogRef.current?.close()}
              aria-label={t("close")}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
          {open && (
            <OrderForm
              target={target}
              plans={plans}
              defaultPlanId={planId}
              whatsappNumber={whatsappNumber}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
