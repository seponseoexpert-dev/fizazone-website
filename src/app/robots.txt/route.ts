import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /cart/
Disallow: /checkout
Disallow: /checkout/
Disallow: /account
Disallow: /account/
Disallow: /payment/
Disallow: /*?*sort=
Disallow: /*?*filter=

User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /cart
Disallow: /checkout
Disallow: /account

Sitemap: https://faizazone.com/sitemap.xml
`;

export async function GET() {
  let body = FALLBACK;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (url && key) {
      const supabase = createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await supabase
        .from("seo_config")
        .select("value")
        .eq("key", "robots_txt")
        .maybeSingle();
      if (data?.value) body = data.value;
      if (!/Sitemap:/i.test(body)) body += "\n\nSitemap: https://faizazone.com/sitemap.xml\n";
    }
  } catch {
    /* fall back to the static rules */
  }

  return new Response(body.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
