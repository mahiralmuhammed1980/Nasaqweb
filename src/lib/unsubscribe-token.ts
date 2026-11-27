import { createHmac, timingSafeEqual } from "node:crypto";

export type UnsubscribeIdentity = {
  email?: string;
  phone?: string;
  userId?: string;
  /** قناة واحدة أو كل القنوات (الافتراضي) */
  channel?: "EMAIL" | "WHATSAPP" | "SMS";
};

const PREFIX = "unsubscribe-v1";

function key(secret: string) {
  return createHmac("sha256", secret).update(PREFIX).digest();
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", key(secret)).update(payload).digest("base64url");
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret)
    throw new Error("AUTH_SECRET is required to sign unsubscribe tokens");
  return secret;
}

/** توكن موقّع لرابط /unsubscribe/[token] (يعمل دون تسجيل دخول ولا ينتهي). */
export function createUnsubscribeToken(
  identity: UnsubscribeIdentity,
  secret = getSecret(),
): string {
  const clean: UnsubscribeIdentity = {};
  if (identity.email) clean.email = identity.email.trim().toLowerCase();
  if (identity.phone) clean.phone = identity.phone;
  if (identity.userId) clean.userId = identity.userId;
  if (identity.channel) clean.channel = identity.channel;
  const payload = Buffer.from(JSON.stringify(clean)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** يعيد الهوية إن كان التوقيع سليماً، وإلا null. */
export function verifyUnsubscribeToken(
  token: string,
  secret = getSecret(),
): UnsubscribeIdentity | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as UnsubscribeIdentity;
    if (!data.email && !data.phone && !data.userId) return null;
    return data;
  } catch {
    return null;
  }
}
