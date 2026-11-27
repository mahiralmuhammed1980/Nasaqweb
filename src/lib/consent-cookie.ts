/** يقرأ كوكي `consent` (JSON): هل وافق الزائر على كوكيز التحليل؟ (شريط الموافقة يُبنى في المرحلة 6) */
export function readAnalyticsConsent(cookieHeader: string): boolean {
  const match = /(?:^|;\s*)consent=([^;]*)/.exec(cookieHeader);
  if (!match?.[1]) return false;
  try {
    return (
      (JSON.parse(decodeURIComponent(match[1])) as { analytics?: boolean })
        .analytics === true
    );
  } catch {
    return false;
  }
}
