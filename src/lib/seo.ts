import { supabase } from "@/integrations/supabase/client";

export type HreflangAlt = { hreflang: string; href: string };

export type SeoMetaRow = {
  id: string;
  page_type: string;
  page_key: string;
  page_label: string;
  country_code: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  canonical_url: string;
  hreflang: HreflangAlt[];
  created_at: string;
  updated_at: string;
};

export const SEO_PAGE_TYPES = ["home", "category", "product", "static"] as const;
export type SeoPageType = (typeof SEO_PAGE_TYPES)[number];

export const SEO_BASE_URL = "https://faizazone.com";

export const SEO_COUNTRY_PATHS: Record<string, string> = {
  bd: "/bd",
  uk: "/uk",
  us: "/usa",
  usa: "/usa",
  ca: "/ca",
  au: "/au",
};

function parseHreflang(value: unknown): HreflangAlt[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      hreflang: String(v["hreflang"] ?? ""),
      href: String(v["href"] ?? ""),
    }))
    .filter((v) => v.hreflang || v.href);
}

export async function fetchSeoMeta(): Promise<SeoMetaRow[]> {
  const { data, error } = await supabase
    .from("seo_meta")
    .select("*")
    .order("page_type")
    .order("page_key")
    .order("country_code");
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, hreflang: parseHreflang(r.hreflang) }) as SeoMetaRow);
}

export type SeoMetaInput = Partial<Omit<SeoMetaRow, "hreflang">> & { hreflang?: HreflangAlt[] };

export async function saveSeoMeta(row: SeoMetaInput) {
  const payload = {
    page_type: row.page_type ?? "static",
    page_key: (row.page_key ?? "").trim(),
    page_label: (row.page_label ?? "").trim(),
    country_code: (row.country_code ?? "bd").toLowerCase().trim(),
    meta_title: row.meta_title ?? "",
    meta_description: row.meta_description ?? "",
    slug: row.slug ?? "",
    canonical_url: row.canonical_url ?? "",
    hreflang: (row.hreflang ?? []) as unknown as never,
  };
  if (row.id) {
    const { error } = await supabase.from("seo_meta").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("seo_meta")
      .upsert(payload, { onConflict: "page_type,page_key,country_code" });
    if (error) throw error;
  }
}

export async function deleteSeoMeta(id: string) {
  const { error } = await supabase.from("seo_meta").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSeoConfig(key: string): Promise<string> {
  const { data, error } = await supabase.from("seo_config").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? "";
}

export async function saveSeoConfig(key: string, value: string) {
  const { error } = await supabase.from("seo_config").upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
}
