"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Laptop, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "w-full",
  tablet: "w-full max-w-[768px]",
  mobile: "w-full max-w-[375px]",
};

const DEVICE_ICON = {
  desktop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
} as const;

type Props = {
  demoUrl: string;
  embeddable: boolean;
  username: string | null;
  password: string | null;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const t = useTranslations("Products.preview");
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* المتصفح منع النسخ: المستخدم ينسخ يدوياً */
    }
  }
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <code dir="ltr" className="bg-muted rounded px-2 py-1">
        {value}
      </code>
      <Button type="button" size="sm" variant="outline" onClick={copy}>
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}

/** المعاينة الحية: لا يُحمَّل الـ iframe قبل النقر، وتعرض demoUrl (نسخة تجريبية) فقط. */
export function LivePreview({
  demoUrl,
  embeddable,
  username,
  password,
}: Props) {
  const t = useTranslations("Products.preview");
  const [started, setStarted] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="border-border rounded-xl border p-4">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {(username || password) && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">{t("credentials")}</p>
          {username && <CopyField label={t("username")} value={username} />}
          {password && <CopyField label={t("password")} value={password} />}
        </div>
      )}
      <p className="text-muted-foreground mt-3 text-sm">{t("note")}</p>

      {!embeddable ? (
        <Button asChild className="mt-4">
          <a href={demoUrl} target="_blank" rel="noopener noreferrer">
            {t("openNewTab")}
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </Button>
      ) : (
        <>
          <div
            role="group"
            aria-label={t("devices")}
            className="mt-4 flex gap-2"
          >
            {(Object.keys(DEVICE_WIDTH) as Device[]).map((value) => {
              const Icon = DEVICE_ICON[value];
              return (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={device === value ? "default" : "outline"}
                  aria-pressed={device === value}
                  onClick={() => setDevice(value)}
                >
                  <Icon className="size-4" aria-hidden />
                  {t(`device.${value}`)}
                </Button>
              );
            })}
          </div>

          <div className="bg-muted mt-4 flex justify-center rounded-lg p-3">
            <div
              className={cn(
                "border-border bg-background overflow-hidden rounded-lg border",
                DEVICE_WIDTH[device],
              )}
            >
              {started ? (
                <iframe
                  src={demoUrl}
                  title={t("frameTitle")}
                  className="h-[560px] w-full"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-[560px] items-center justify-center">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setStarted(true)}
                  >
                    {t("start")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
