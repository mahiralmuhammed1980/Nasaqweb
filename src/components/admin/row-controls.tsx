"use client";

import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
};

export function RowControls({ index, count, onMove, onRemove }: Props) {
  const t = useTranslations("AdminProducts.row");
  return (
    <div className="flex items-center gap-1">
      <GripVertical
        className="text-muted-foreground size-4 cursor-grab"
        aria-hidden
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={t("up")}
      >
        <ArrowUp className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={t("down")}
      >
        <ArrowDown className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRemove}
        aria-label={t("remove")}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
