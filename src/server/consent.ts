import { currentConsent, type ConsentChannelId } from "@/lib/consent";
import { db } from "@/lib/db";
import type { UnsubscribeIdentity } from "@/lib/unsubscribe-token";

/** سجلات الموافقة لهوية: تطابق أي من البريد أو الهاتف أو معرّف المستخدم. */
export async function consentStateFor(identity: UnsubscribeIdentity) {
  const or = [
    ...(identity.email ? [{ email: identity.email }] : []),
    ...(identity.phone ? [{ phone: identity.phone }] : []),
    ...(identity.userId ? [{ userId: identity.userId }] : []),
  ];
  if (or.length === 0) return currentConsent([]);
  const records = await db.consentRecord.findMany({
    where: { OR: or },
    select: { channel: true, granted: true, createdAt: true },
  });
  return currentConsent(records);
}

export function channelsOf(identity: UnsubscribeIdentity): ConsentChannelId[] {
  return identity.channel ? [identity.channel] : ["EMAIL", "WHATSAPP", "SMS"];
}
