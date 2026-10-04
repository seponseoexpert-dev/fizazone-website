import { NextResponse } from "next/server";
import { supabase } from "@/integrations/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site", "theme"]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const siteRow = data?.find((r) => r.key === "site")?.value as Record<string, unknown> | undefined;
    const themeRow = data?.find((r) => r.key === "theme")?.value as Record<string, unknown> | undefined;

    const logo_url =
      (typeof themeRow?.logo_url === "string" && themeRow.logo_url) ||
      (typeof siteRow?.logo_url === "string" && siteRow.logo_url) ||
      "";

    const favicon_url =
      (typeof themeRow?.favicon_url === "string" && themeRow.favicon_url) ||
      (typeof siteRow?.favicon_url === "string" && siteRow.favicon_url) ||
      "";

    const footer_logo_url =
      (typeof themeRow?.footer_logo_url === "string" && themeRow.footer_logo_url) ||
      (typeof themeRow?.logo_url === "string" && themeRow.logo_url) ||
      (typeof siteRow?.logo_url === "string" && siteRow.logo_url) ||
      "";

    const site_title =
      (typeof siteRow?.site_title === "string" && siteRow.site_title) || "Faiza Zone";

    const tagline =
      (typeof siteRow?.tagline === "string" && siteRow.tagline) ||
      "Online Shopping & Gift Store";

    const currency_symbol =
      (typeof siteRow?.currency_symbol === "string" && siteRow.currency_symbol) || "৳";

    const default_currency =
      (typeof siteRow?.default_currency === "string" && siteRow.default_currency) || "BDT";

    return NextResponse.json(
      {
        logo_url,
        favicon_url,
        footer_logo_url,
        site_title,
        tagline,
        currency_symbol,
        default_currency,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
