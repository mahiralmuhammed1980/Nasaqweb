"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { confirmUnsubscribe } from "@/server/actions/unsubscribe";

/** تأكيد صريح بنقرة: روابط البريد قد تُفتح آلياً بماسحات الأمان فلا نُلغي الاشتراك بمجرد فتح الصفحة. */
export function UnsubscribeForm({ token }: { token: string }) {
  const t = useTranslations("Unsubscribe");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<"idle" | "done" | "already" | "failed">(
    "idle",
  );

  if (result === "done" || result === "already") {
    return (
      <p
        role="status"
        className="text-lg font-medium"
        data-testid="unsubscribe-result"
      >
        {t(result === "done" ? "done" : "already")}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await confirmUnsubscribe(token);
            setResult(!r.ok ? "failed" : r.changed > 0 ? "done" : "already");
          })
        }
      >
        {pending ? t("working") : t("confirm")}
      </Button>
      {result === "failed" && (
        <p role="alert" className="text-sm text-red-700">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
