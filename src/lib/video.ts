export type VideoProviderId = "YOUTUBE" | "BUNNY";

const YOUTUBE_ID = /^[\w-]{11}$/;
// Bunny: "libraryId/videoGuid"
const BUNNY_ID = /^\d+\/[0-9a-f-]{36}$/i;

export function isValidVideoId(
  provider: VideoProviderId,
  videoId: string,
): boolean {
  return provider === "YOUTUBE"
    ? YOUTUBE_ID.test(videoId)
    : BUNNY_ID.test(videoId);
}

/** رابط التضمين. يعيد null لمعرّف غير صالح (لا نبني روابط من مدخلات غير مفحوصة). */
export function embedUrl(
  provider: VideoProviderId,
  videoId: string,
): string | null {
  if (!isValidVideoId(provider, videoId)) return null;
  return provider === "YOUTUBE"
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : `https://iframe.mediadelivery.net/embed/${videoId}`;
}

export function posterUrl(
  provider: VideoProviderId,
  videoId: string,
): string | null {
  if (provider === "YOUTUBE" && YOUTUBE_ID.test(videoId))
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return null;
}
