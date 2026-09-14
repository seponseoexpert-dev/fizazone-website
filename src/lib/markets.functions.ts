"use server";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mapMarket, type Market } from "@/lib/markets";

/**
 * Public market list — safe for SSR/prerender so pages
 * can build canonical + hreflang tags on the server.
 */
export async function getMarkets(): Promise<Market[]> {
  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://qfgipvkpfxaofcgrwqwo.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ2lwdmtwZnhhb2ZjZ3J3cXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjE1NDYsImV4cCI6MjEwMjc5NzU0Nn0.f4oP2aUpFfqeiN5_sSh0IizHemSiAmrVW_XJQ5b8caQ";

    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("countries")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapMarket);
  } catch {
    return [];
  }
}
