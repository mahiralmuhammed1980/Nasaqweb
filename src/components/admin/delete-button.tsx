"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

type Props = {
  id: string;
  action: (input: unknown) => Promise<{ ok: boolean }>;
  confirmText: string;
  label?: string;
};

export function DeleteButton({ id, action, confirmText, label }: Props) {
  const t = useTranslations("AdminProducts");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          setFailed(false);
          startTransition(async () => {
            const result = await action({ id });
            if (result.ok) router.refresh();
            else setFailed(true);
          });
        }}
      >
        {label ?? t("delete")}
      </Button>
      {failed && (
        <span role="alert" className="text-xs text-red-700">
          {t("errors.generic")}
        </span>
      )}
    </>
  );
}
