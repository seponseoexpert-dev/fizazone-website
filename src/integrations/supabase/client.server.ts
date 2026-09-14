import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qfgipvkpfxaofcgrwqwo.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZ2lwdmtwZnhhb2ZjZ3J3cXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjE1NDYsImV4cCI6MjEwMjc5NzU0Nn0.f4oP2aUpFfqeiN5_sSh0IizHemSiAmrVW_XJQ5b8caQ";

export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
