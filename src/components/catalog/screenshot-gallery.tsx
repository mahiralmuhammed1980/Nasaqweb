"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";

type Shot = { url: string; alt: string };

/** معرض لقطات مع lightbox بعنصر <dialog> الأصلي (إغلاق بـ Esc، وتنقل بالأسهم). */
export function ScreenshotGallery({ shots }: { shots: Shot[] }) {
  const t = useTranslations("Products.gallery");
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const isRtl = locale === "ar";

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const close = useCallback(() => {
    dialogRef.current?.close();
    setIndex(null);
  }, []);
  const move = useCallback(
    (delta: number) =>
      setIndex((current) =>
        current === null
          ? current
          : (current + delta + shots.length) % shots.length,
      ),
    [shots.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      // في RTL السهم الأيسر يعني "التالي"
      const next = isRtl ? "ArrowLeft" : "ArrowRight";
      const prev = isRtl ? "ArrowRight" : "ArrowLeft";
      if (event.key === next) move(1);
      else if (event.key === prev) move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, isRtl, move]);

  if (shots.length === 0) return null;
  const current = index === null ? null : shots[index];

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shots.map((shot, i) => (
          <li key={shot.url}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={t("open", { alt: shot.alt })}
              className="border-border relative block aspect-video w-full overflow-hidden rounded-lg border"
            >
              <AppImage
                src={shot.url}
                alt={shot.alt}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        aria-label={t("dialog")}
        className="m-auto size-full max-h-screen max-w-none bg-black/90 p-0 backdrop:bg-black/80"
      >
        {current && (
          <div className="relative flex size-full items-center justify-center p-4">
            <div className="relative h-full w-full max-w-5xl">
              <AppImage
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={close}
              className="absolute end-4 top-4"
              aria-label={t("close")}
            >
              <X className="size-4" aria-hidden />
            </Button>
            {shots.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => move(-1)}
                  className="absolute start-4 top-1/2"
                  aria-label={t("previous")}
                >
                  <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => move(1)}
                  className="absolute end-4 top-1/2"
                  aria-label={t("next")}
                >
                  <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                </Button>
              </>
            )}
            <p className="absolute start-1/2 bottom-4 -translate-x-1/2 rounded bg-black/60 px-3 py-1 text-sm text-white rtl:translate-x-1/2">
              {t("counter", { current: (index ?? 0) + 1, total: shots.length })}
            </p>
          </div>
        )}
      </dialog>
    </div>
  );
}
