"use server";

import { createPresignedImageUpload } from "@/lib/storage/r2";
import {
  isAllowedImageType,
  validateImageUpload,
} from "@/lib/storage/image-upload";
import { imageUploadSchema } from "@/validators/product";
import { ActionError, adminAction } from "./admin-action";

const action = adminAction(imageUploadSchema, async ({ contentType, size }) => {
  const check = validateImageUpload(contentType, size);
  if (check !== "ok" || !isAllowedImageType(contentType))
    throw new ActionError(`UPLOAD_${check}`);
  const signed = await createPresignedImageUpload(contentType, size);
  if (!signed) throw new ActionError("STORAGE_NOT_CONFIGURED");
  return signed;
});

/** يتحقق من النوع والحجم في الخادم ثم يصدر رابط رفع موقّعاً إلى R2. */
export async function requestImageUpload(input: unknown) {
  return action(input);
}
