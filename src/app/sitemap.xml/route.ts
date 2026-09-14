import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mapMarket, isShoppable } from "@/lib/markets";

const BASE_URL = "https://faizazone.com";

const STATIC_PATHS = [
  "",
  "/categories",
  "/about",
  "/contact",
  "/size-guide",
  "/return-policy",
  "/track-order",
];

/** Paths that exist inside every market prefix. */
const MARKET_PATHS = ["", "/categories"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const only = (url.searchParams.get("country") ?? "").toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  let markets: ReturnType<typeof mapMarket>[] = [];
  let products: { id: string; slug: string | null }[] = [];

  if (supabaseUrl && key) {
    const supabase = createClient<Database>(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      const [{ data: countryRows }, { data: productRows }] = await Promise.all([
        supabase.from("countries").select("*").order("sort_order"),
        supabase.from("products").select("id,slug").limit(1000),
      ]);
      markets = ((countryRows ?? []) as unknown as Record<string, unknown>[])
        .map(mapMarket)
        .filter(isShoppable);
      products = (productRows ?? []) as { id: string; slug: string | null }[];
    } catch {
      /* fall through with whatever we have */
    }
  }

  if (only) markets = markets.filter((m) => m.prefix === only);

  const paths = new Set<string>();
  if (!only) for (const p of STATIC_PATHS) paths.add(p || "/");

  for (const m of markets) {
    for (const p of MARKET_PATHS) paths.add(`/${m.prefix}${p}`);
    for (const prod of products) paths.add(`/${m.prefix}/product/${prod.slug || prod.id}`);
  }

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...Array.from(paths).map((p) => `  <url>\n    <loc>${BASE_URL}${p}</loc>\n  </url>`),
    `</urlset>`,
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
