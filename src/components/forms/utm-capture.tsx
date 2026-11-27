"use client";

import { useEffect } from "react";
import { readAnalyticsConsent } from "@/lib/consent-cookie";

const KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** يحفظ معاملات UTM في sessionStorage فقط إن وافق الزائر على كوكيز التحليل. */
export function UtmCapture() {
  useEffect(() => {
    if (!readAnalyticsConsent(document.cookie)) return;
    const params = new URLSearchParams(window.location.search);
    try {
      for (const key of KEYS) {
        const value = params.get(key);
        if (value) sessionStorage.setItem(key, value.slice(0, 100));
      }
    } catch {
      /* sessionStorage غير متاح */
    }
  }, []);
  return null;
}
