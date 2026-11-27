"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { changeContactMessageStatus } from "@/server/actions/admin/orders";
import { MESSAGE_STATUSES } from "@/validators/admin-orders";

export function MessageStatusButtons({
  id,
  status,
}: {
  id: string;
  status: (typeof MESSAGE_STATUSES)[number];
}) {
  const t = useTranslations("AdminMessages");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div role="group" aria-label={t("status")} className="flex flex-wrap gap-2">
      {MESSAGE_STATUSES.map((s) => (
        <Button
          key={s}
          type="button"
          size="sm"
          variant={status === s ? "default" : "outline"}
          aria-pressed={status === s}
          disabled={pending || status === s}
          onClick={() =>
            startTransition(async () => {
              const r = await changeContactMessageStatus({ id, status: s });
              if (r.ok) router.refresh();
            })
          }
        >
          {t(`statuses.${s}`)}
        </Button>
      ))}
    </div>
  );
}
