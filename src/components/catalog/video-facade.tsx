"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { embedUrl, posterUrl, type VideoProviderId } from "@/lib/video";

type Props = {
  provider: VideoProviderId;
  videoId: string;
  title: string;
  fallbackPoster: string;
};

/** واجهة خفيفة: صورة + زر تشغيل. المشغّل (iframe) لا يُحمَّل إلا عند النقر. */
export function VideoFacade({
  provider,
  videoId,
  title,
  fallbackPoster,
}: Props) {
  const t = useTranslations("Products.video");
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const embed = embedUrl(provider, videoId);
  if (!embed) return null;

  return (
    <div className="bg-muted relative aspect-video overflow-hidden rounded-xl">
      {playing ? (
        <iframe
          src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
          title={title}
          className="absolute inset-0 size-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={t("play", { title })}
          className="group absolute inset-0 size-full"
        >
          <AppImage
            src={(!posterFailed && posterUrl(provider, videoId)) || fallbackPoster}
            alt=""
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover"
            onError={() => setPosterFailed(true)}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
            <span className="bg-background text-foreground flex size-16 items-center justify-center rounded-full">
              <Play className="size-7 rtl:-scale-x-100" aria-hidden />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
