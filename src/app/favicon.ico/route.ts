import { NextResponse } from "next/server";
import { fetchServerSiteBranding } from "@/lib/site-branding-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const branding = await fetchServerSiteBranding();
    if (branding.favicon_url) {
      return NextResponse.redirect(branding.favicon_url, {
        status: 307,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }
  } catch (err) {
    console.warn("Error serving favicon.ico:", err);
  }

  // Redirect to api/favicon handler as fallback
  return NextResponse.redirect("https://faizazone.com/api/favicon", { status: 302 });
}
