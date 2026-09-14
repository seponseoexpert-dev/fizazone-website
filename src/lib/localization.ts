import { supabase } from "@/integrations/supabase/client";
import { normalizePrefix } from "@/lib/markets";

export type Country = {
  id: string;
  name: string;
  code: string;
  currency: string;
  currency_symbol: string;
  default_language: string;
  phone_code: string;
  is_active: boolean;
  // Market fields (Admin → Countries)
  iso_code?: string | null;
  url_prefix?: string | null;
  is_default_market?: boolean;
  sort_order?: number;
  locale?: string;
  timezone?: string;
  date_format?: string;
  number_format?: string;
  fx_rate?: number;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  canonical_base?: string;
  hreflang?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  storefront_enabled?: boolean;
  shipping_enabled?: boolean;
  cod_enabled?: boolean;
  online_payment_enabled?: boolean;
  regional_pricing_enabled?: boolean;
};

export type CategoryCountryRow = {
  id: string;
  category: string;
  country_code: string;
  is_visible: boolean;
  custom_name: string | null;
};

export type ProductCountryRow = {
  id: string;
  product_id: string;
  country_code: string;
  price: number;
  sale_price: number | null;
  shipping_fee: number;
  currency: string;
  stock_qty: number;
  is_visible: boolean;
};

export const DEFAULT_COUNTRY_CODES = ["bd", "uk", "us", "ca", "au"];

export async function fetchCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Country[];
}

export async function saveCountry(row: Partial<Country>) {
  const prefix = normalizePrefix(row.url_prefix || row.code || "");
  const iso = (row.iso_code ?? "").trim().toUpperCase();

  if (!row.name?.trim()) throw new Error("Country name is required");
  if (!prefix) throw new Error("URL prefix is required (for example: bd)");
  if (iso && iso.length !== 2 && iso !== "XX") throw new Error("ISO code must be 2 letters");

  // Duplicate guards — the DB enforces these too, this gives a friendly error.
  const existing = await fetchCountries();
  const clash = existing.find(
    (c) =>
      c.id !== row.id &&
      (normalizePrefix(c.url_prefix || c.code) === prefix ||
        (iso && (c.iso_code ?? "").toUpperCase() === iso)),
  );
  if (clash) throw new Error(`"${clash.name}" already uses this URL prefix or ISO code`);

  const payload = {
    name: row.name.trim(),
    code: (row.code || prefix).toLowerCase().trim(),
    currency: row.currency ?? "USD",
    currency_symbol: row.currency_symbol ?? "$",
    default_language: row.default_language ?? "en",
    phone_code: row.phone_code ?? "",
    is_active: row.is_active ?? true,
    iso_code: iso || prefix.slice(0, 2).toUpperCase(),
    url_prefix: prefix,
    is_default_market: row.is_default_market ?? false,
    sort_order: Number(row.sort_order ?? 0) || 0,
    locale: row.locale || "en",
    timezone: row.timezone || "UTC",
    date_format: row.date_format || "DD/MM/YYYY",
    number_format: row.number_format || "1,234.56",
    fx_rate: Number(row.fx_rate ?? 1) || 1,
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    canonical_base: row.canonical_base ?? "",
    hreflang: row.hreflang ?? "",
    og_title: row.og_title ?? "",
    og_description: row.og_description ?? "",
    og_image: row.og_image ?? "",
    storefront_enabled: row.storefront_enabled ?? true,
    shipping_enabled: row.shipping_enabled ?? true,
    cod_enabled: row.cod_enabled ?? false,
    online_payment_enabled: row.online_payment_enabled ?? true,
    regional_pricing_enabled: row.regional_pricing_enabled ?? false,
  };

  // Only one market may be x-default.
  if (payload.is_default_market) {
    const { error: clearErr } = await supabase
      .from("countries")
      .update({ is_default_market: false })
      .eq("is_default_market", true)
      .neq("id", row.id ?? "00000000-0000-0000-0000-000000000000");
    if (clearErr) throw clearErr;
  }

  if (row.id) {
    const { error } = await supabase.from("countries").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("countries").insert(payload);
    if (error) throw error;
  }
}

/** Counts rows that reference a market, so we never hard-delete live data. */
export async function countryDependencies(country: Country): Promise<string[]> {
  const codes = Array.from(
    new Set(
      [country.code, country.url_prefix ?? "", (country.iso_code ?? "").toLowerCase()].filter(
        Boolean,
      ),
    ),
  ) as string[];

  const checks: { label: string; table: "orders" | "banners" | "promotions" | "coupons" | "product_country_map" | "category_country_map" | "seo_meta" | "product_sections" | "profiles" }[] = [
    { label: "Orders", table: "orders" },
    { label: "Customers", table: "profiles" },
    { label: "Products", table: "product_country_map" },
    { label: "Categories", table: "category_country_map" },
    { label: "Banners", table: "banners" },
    { label: "Promotions", table: "promotions" },
    { label: "Coupons", table: "coupons" },
    { label: "Product sections", table: "product_sections" },
    { label: "SEO settings", table: "seo_meta" },
  ];

  const used: string[] = [];
  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table)
      .select("*", { count: "exact", head: true })
      .in("country_code", codes);
    if (!error && (count ?? 0) > 0) used.push(`${check.label} (${count})`);
  }
  return used;
}

export async function deleteCountry(id: string) {
  const { error } = await supabase.from("countries").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCategoryMap(): Promise<CategoryCountryRow[]> {
  const { data, error } = await supabase.from("category_country_map").select("*");
  if (error) throw error;
  return (data ?? []) as CategoryCountryRow[];
}

export async function upsertCategoryMap(
  rows: { category: string; country_code: string; is_visible: boolean; custom_name: string | null }[],
) {
  const { error } = await supabase
    .from("category_country_map")
    .upsert(rows, { onConflict: "category,country_code" });
  if (error) throw error;
}

export async function fetchProductMap(productId: string): Promise<ProductCountryRow[]> {
  const { data, error } = await supabase
    .from("product_country_map")
    .select("*")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? []) as ProductCountryRow[];
}

export async function upsertProductMap(
  rows: {
    product_id: string;
    country_code: string;
    price: number;
    sale_price?: number | null;
    shipping_fee?: number;
    currency: string;
    stock_qty: number;
    is_visible: boolean;
  }[],
) {
  if (!rows.length) return;
  const { error } = await supabase
    .from("product_country_map")
    .upsert(rows, { onConflict: "product_id,country_code" });
  if (error) throw error;
}
