import { createHash } from "node:crypto";

type HeaderReader = { get(name: string): string | null };

/**
 * عنوان IP للعميل. على Vercel الترويسة `x-vercel-forwarded-for` تضعها المنصة ولا يمكن انتحالها،
 * وإلا نأخذ أول قيمة من `x-forwarded-for` ثم `x-real-ip`.
 */
export function getClientIp(headers: HeaderReader): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** IP لا يُخزَّن خاماً أبداً: تجزئة مع ملح (IP_HASH_SALT). */
export function hashIp(
  ip: string,
  salt = process.env.IP_HASH_SALT ?? process.env.AUTH_SECRET ?? "dev-only-salt",
) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
