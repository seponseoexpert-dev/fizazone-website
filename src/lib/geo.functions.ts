"use server";

import { headers } from "next/headers";

/**
 * Resolve the visitor's ISO country from real request data.
 * Edge/CDN headers first (Cloudflare, Vercel, Fastly), then a server-side IP
 * lookup as a fallback for local/dev requests.
 */
export async function getVisitorCountry() {
  try {
    const headersList = await headers();
    const headerCodes = [
      headersList.get("cf-ipcountry"),
      headersList.get("x-vercel-ip-country"),
      headersList.get("x-country-code"),
      headersList.get("cloudfront-viewer-country"),
    ].filter(Boolean) as string[];

    const fromHeader = headerCodes.find(
      (c) => /^[A-Za-z]{2}$/.test(c) && c.toUpperCase() !== "XX",
    );
    if (fromHeader) return { country: fromHeader.toUpperCase(), source: "header" as const };

    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      undefined;

    const isPrivate =
      !ip ||
      ip.startsWith("127.") ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      ip === "::1";

    if (isPrivate) return { country: null, source: "unknown" as const };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://ipapi.co/${ip}/country/`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      const text = (await res.text()).trim();
      if (/^[A-Za-z]{2}$/.test(text)) return { country: text.toUpperCase(), source: "ip" as const };
    } catch {
      /* ignore */
    }

    return { country: null, source: "unknown" as const };
  } catch {
    return { country: null, source: "unknown" as const };
  }
}
