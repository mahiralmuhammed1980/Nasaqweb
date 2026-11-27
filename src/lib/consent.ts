export const CONSENT_CHANNELS = ["EMAIL", "WHATSAPP", "SMS"] as const;
export type ConsentChannelId = (typeof CONSENT_CHANNELS)[number];

/** رقم إصدار نص الموافقة. يُرفع عند تغيير الصياغة (الأقدم يبقى محفوظاً بنصه). */
export const CONSENT_POLICY_VERSION = 1;

export type ConsentRow = {
  channel: ConsentChannelId;
  granted: boolean;
  createdAt: Date;
};

/** الحالة الحالية = آخر سجل لكل قناة؛ غياب السجل يعني «لم يوافق». */
export function currentConsent(
  records: readonly ConsentRow[],
): Record<ConsentChannelId, boolean> {
  const state: Record<ConsentChannelId, boolean> = {
    EMAIL: false,
    WHATSAPP: false,
    SMS: false,
  };
  const latest = new Map<ConsentChannelId, Date>();
  for (const record of records) {
    const seen = latest.get(record.channel);
    if (!seen || record.createdAt.getTime() >= seen.getTime()) {
      latest.set(record.channel, record.createdAt);
      state[record.channel] = record.granted;
    }
  }
  return state;
}

/**
 * القنوات التي تشملها خانة الموافقة الواحدة في نموذجي الطلب والتواصل:
 * البريد إن قدّم بريداً، وواتساب إن أكد أن رقمه عليه واتساب. SMS لا يُمنح من النماذج العامة.
 */
export function channelsForForm(input: {
  email?: string | null;
  phoneHasWhatsapp?: boolean;
}): ConsentChannelId[] {
  const channels: ConsentChannelId[] = [];
  if (input.email) channels.push("EMAIL");
  if (input.phoneHasWhatsapp) channels.push("WHATSAPP");
  return channels;
}
