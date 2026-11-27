"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** عدّاد تنازلي حتى endsAt. لا يُصيَّر قبل التحميل (تجنب اختلاف الوقت بين الخادم والمتصفح). */
export function Countdown({ endsAt }: { endsAt: string }) {
  const t = useTranslations("Offers");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null)
    return <span className="inline-block h-5 w-32" aria-hidden />;
  const remaining = new Date(endsAt).getTime() - now;
  if (remaining <= 0)
    return <span className="text-sm font-medium">{t("ended")}</span>;
  const { days, hours, minutes, seconds } = parts(remaining);
  return (
    <span className="text-sm font-medium tabular-nums">
      {t("endsIn", { days, hours, minutes, seconds })}
    </span>
  );
}
