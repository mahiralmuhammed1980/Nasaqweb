import Image, { type ImageProps } from "next/image";

/** next/image مع تعطيل التحسين لملفات SVG (لا يدعمها المحسّن افتراضياً). */
export function AppImage({ alt, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return (
    <Image
      alt={alt}
      {...props}
      unoptimized={props.unoptimized ?? src.toLowerCase().endsWith(".svg")}
    />
  );
}
