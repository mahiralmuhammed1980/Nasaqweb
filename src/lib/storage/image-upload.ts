import { randomUUID } from "node:crypto";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export function isAllowedImageType(value: string): value is AllowedImageType {
  return value in ALLOWED_IMAGE_TYPES;
}

/** فحص النوع والحجم في الخادم قبل إصدار الرابط الموقّع. */
export function validateImageUpload(
  contentType: string,
  size: number,
): "ok" | "TYPE" | "SIZE" {
  if (!isAllowedImageType(contentType)) return "TYPE";
  if (!Number.isInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES)
    return "SIZE";
  return "ok";
}

export function buildObjectKey(
  contentType: AllowedImageType,
  now = new Date(),
): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${now.getUTCFullYear()}/${month}/${randomUUID()}.${ALLOWED_IMAGE_TYPES[contentType]}`;
}
