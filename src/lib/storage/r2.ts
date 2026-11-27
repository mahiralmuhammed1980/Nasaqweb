import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { buildObjectKey, type AllowedImageType } from "./image-upload";

function config() {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    NEXT_PUBLIC_R2_PUBLIC_URL,
  } = process.env;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET ||
    !NEXT_PUBLIC_R2_PUBLIC_URL
  ) {
    return null;
  }
  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
    publicUrl: NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, ""),
  };
}

export function isStorageConfigured(): boolean {
  return config() !== null;
}

/** رابط رفع موقّع (PUT) صالح 5 دقائق؛ الحجم مثبّت في التوقيع فلا يمكن تجاوزه. */
export async function createPresignedImageUpload(
  contentType: AllowedImageType,
  size: number,
) {
  const cfg = config();
  if (!cfg) return null;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  const key = buildObjectKey(contentType);
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    { expiresIn: 300 },
  );
  return { uploadUrl, publicUrl: `${cfg.publicUrl}/${key}` };
}
