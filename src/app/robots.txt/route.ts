import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK = "User-agent: *\nAllow: /\n\nSitemap: https://faizazone.com/sitemap.xml\n";

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

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=600",
    },
  });
}
