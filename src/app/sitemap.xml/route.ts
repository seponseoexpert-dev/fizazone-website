import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mapMarket, isShoppable } from "@/lib/markets";

const BASE_URL = "https://faizazone.com";

type StaticRouteDef = {
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

const STATIC_ROUTES: StaticRouteDef[] = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "/categories", changefreq: "daily", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/size-guide", changefreq: "monthly", priority: "0.5" },
  { path: "/return-policy", changefreq: "monthly", priority: "0.5" },
  { path: "/track-order", changefreq: "monthly", priority: "0.5" },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const only = (url.searchParams.get("country") ?? "").toLowerCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  let markets: { prefix: string }[] = [];
  let products: { id: string; slug: string | null; name: string | null; images: string[] | null; created_at?: string }[] = [];

  if (supabaseUrl && key) {
    const supabase = createClient<Database>(supabaseUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      const [{ data: countryRows }, { data: productRows }] = await Promise.all([
        supabase.from("countries").select("*").order("sort_order"),
        supabase.from("products").select("id,slug,name,images,created_at").limit(1000),
      ]);
      markets = ((countryRows ?? []) as unknown as Record<string, unknown>[])
        .map(mapMarket)
        .filter(isShoppable);
      products = (productRows ?? []) as typeof products;
    } catch {
      /* fall through with whatever we have */
    }
  }

  if (markets.length === 0) {
    markets = [{ prefix: "bd" }, { prefix: "us" }, { prefix: "uk" }];
  }

  if (only) markets = markets.filter((m) => m.prefix === only);

  const today = new Date().toISOString().split("T")[0];
  const urlEntries: string[] = [];

  // 1. Static global routes (if not filtering by country)
  if (!only) {
    for (const r of STATIC_ROUTES) {
      urlEntries.push(`  <url>
    <loc>${BASE_URL}${r.path || "/"}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`);
    }
  }

  // 2. Regional Storefront Market Routes
  for (const m of markets) {
    // Market Homepage
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/${m.prefix}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

    // Market Categories
    urlEntries.push(`  <url>
    <loc>${BASE_URL}/${m.prefix}/categories</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

    // Market Products
    for (const prod of products) {
      const slug = prod.slug || prod.id;
      const prodDate = prod.created_at ? prod.created_at.split("T")[0] : today;
      const imgUrl = prod.images?.[0];
      const imageSnippet = imgUrl
        ? `\n    <image:image>\n      <image:loc>${imgUrl}</image:loc>\n      <image:title><![CDATA[${prod.name || "Product"}]]></image:title>\n    </image:image>`
        : "";

      urlEntries.push(`  <url>
    <loc>${BASE_URL}/${m.prefix}/product/${slug}</loc>
    <lastmod>${prodDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageSnippet}
  </url>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
