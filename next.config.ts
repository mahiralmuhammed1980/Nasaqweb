import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function r2Pattern() {
  const raw = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [...r2Pattern(), { protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default withNextIntl(nextConfig);
