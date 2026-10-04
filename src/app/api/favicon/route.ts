import { NextResponse } from "next/server";
import { supabase } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site", "theme"]);

    const siteRow = data?.find((r) => r.key === "site")?.value as Record<string, unknown> | undefined;
    const themeRow = data?.find((r) => r.key === "theme")?.value as Record<string, unknown> | undefined;

    const faviconUrl =
      (typeof themeRow?.favicon_url === "string" && themeRow.favicon_url) ||
      (typeof siteRow?.favicon_url === "string" && siteRow.favicon_url) ||
      "";

    if (faviconUrl) {
      // 307 temporary redirect to the uploaded favicon URL with no-cache headers
      return NextResponse.redirect(faviconUrl, {
        status: 307,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      });
    }

    // Fallback to static favicon
    return NextResponse.redirect(new URL("/favicon.ico", "https://faizazone.com"), {
      status: 302,
    });
  } catch (err) {
    return new Response(null, { status: 404 });
  }
}
