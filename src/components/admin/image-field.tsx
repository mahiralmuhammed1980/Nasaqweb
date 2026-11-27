"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  validateImageUpload,
} from "@/lib/storage/image-upload";
import { requestImageUpload } from "@/server/actions/admin/images";
import { inputClass } from "./field";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  invalid?: boolean;
};

/** رفع صورة إلى R2 برابط موقّع (سحب وإفلات أو اختيار ملف)، مع إدخال رابط يدوي كبديل. */
export function ImageField({ value, onChange, label, invalid }: Props) {
  const t = useTranslations("AdminProducts.image");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    setError(null);
    const check = validateImageUpload(file.type, file.size);
    if (check !== "ok")
      return setError(
        t(check === "TYPE" ? "errorType" : "errorSize", {
          max: MAX_IMAGE_BYTES / 1024 / 1024,
        }),
      );
    setBusy(true);
    try {
      const result = await requestImageUpload({
        contentType: file.type,
        size: file.size,
      });
      if (!result.ok)
        return setError(
          result.error === "STORAGE_NOT_CONFIGURED"
            ? t("notConfigured")
            : t("errorUpload"),
        );
      const put = await fetch(result.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) return setError(t("errorUpload"));
      onChange(result.data.publicUrl);
    } catch {
      setError(t("errorUpload"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) void upload(file);
        }}
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3 ${dragOver ? "border-primary bg-muted" : "border-border"}`}
      >
        {value && (
          <div className="bg-muted relative h-16 w-28 overflow-hidden rounded">
            <AppImage
              src={value}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            type="text"
            dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… | /path.png"
            aria-label={label}
            aria-invalid={invalid}
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={Object.keys(ALLOWED_IMAGE_TYPES).join(",")}
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? t("uploading") : t("choose")}
            </Button>
            <span className="text-muted-foreground text-xs">
              {t("hint", { max: MAX_IMAGE_BYTES / 1024 / 1024 })}
            </span>
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
