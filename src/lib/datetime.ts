/** ISO → قيمة حقل datetime-local بتوقيت المتصفح (YYYY-MM-DDTHH:mm) */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** قيمة datetime-local (بتوقيت المتصفح) → ISO بـ UTC */
export function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

export type OfferState = "UPCOMING" | "ACTIVE" | "EXPIRED" | "DISABLED";

/** حالة العرض لعرضها في الإدارة (قادم / سارٍ / منتهٍ) */
export function offerState(
  offer: { startsAt: Date; endsAt: Date; isActive: boolean },
  now: Date = new Date(),
): OfferState {
  if (now.getTime() >= offer.endsAt.getTime()) return "EXPIRED";
  if (!offer.isActive) return "DISABLED";
  if (now.getTime() < offer.startsAt.getTime()) return "UPCOMING";
  return "ACTIVE";
}
