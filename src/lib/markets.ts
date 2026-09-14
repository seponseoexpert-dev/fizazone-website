/**
 * Market layer — the single source of truth for every storefront market.
 *
 * Data lives in the existing `countries` table (extended with ISO code, URL
 * prefix, locale, SEO and storefront flags). Nothing here is hardcoded: adding
 * a row in Admin → Countries is enough to light up a new /prefix storefront.
 */
import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Market = {
  id: string;
  name: string;
  /** legacy short code stored on the row (bd, uk, usa…) */
  code: string;
  isoCode: string;
  /** URL prefix without slashes, e.g. "bd" */
  prefix: string;
  currency: string;
  symbol: string;
  language: string;
  locale: string;
  phoneCode: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  fxRate: number;
  seoTitle: string;
  seoDescription: string;
  canonicalBase: string;
  hreflang: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  storefrontEnabled: boolean;
  shippingEnabled: boolean;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  regionalPricingEnabled: boolean;
};

export const GLOBAL_PREFIX = "global";

export const MARKET_COLUMNS = "*";

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = "") => (typeof v === "string" && v ? v : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
const num = (v: unknown, fallback = 1) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Normalizes any user input into a valid URL prefix: "/BD/" -> "bd". */
export function normalizePrefix(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function mapMarket(row: Row): Market {
  const code = str(row["code"]).toLowerCase();
  return {
    id: str(row["id"]),
    name: str(row["name"]),
    code,
    isoCode: str(row["iso_code"], code.slice(0, 2)).toUpperCase(),
    prefix: normalizePrefix(str(row["url_prefix"], code)),
    currency: str(row["currency"], "USD"),
    symbol: str(row["currency_symbol"], "$"),
    language: str(row["default_language"], "en"),
    locale: str(row["locale"], "en"),
    phoneCode: str(row["phone_code"]),
    timezone: str(row["timezone"], "UTC"),
    dateFormat: str(row["date_format"], "DD/MM/YYYY"),
    numberFormat: str(row["number_format"], "1,234.56"),
    fxRate: num(row["fx_rate"], 1),
    seoTitle: str(row["seo_title"]),
    seoDescription: str(row["seo_description"]),
    canonicalBase: str(row["canonical_base"]),
    hreflang: str(row["hreflang"], str(row["locale"], "en")),
    ogTitle: str(row["og_title"]),
    ogDescription: str(row["og_description"]),
    ogImage: str(row["og_image"]),
    isActive: bool(row["is_active"], true),
    isDefault: bool(row["is_default_market"]),
    sortOrder: Number(row["sort_order"] ?? 0) || 0,
    storefrontEnabled: bool(row["storefront_enabled"], true),
    shippingEnabled: bool(row["shipping_enabled"], true),
    codEnabled: bool(row["cod_enabled"]),
    onlinePaymentEnabled: bool(row["online_payment_enabled"], true),
    regionalPricingEnabled: bool(row["regional_pricing_enabled"]),
  };
}

export async function fetchMarkets(): Promise<Market[]> {
  const { data, error } = await supabase
    .from("countries")
    .select(MARKET_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapMarket);
}

export const marketsQueryOptions = () =>
  queryOptions({
    queryKey: ["markets"],
    queryFn: fetchMarkets,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

/** All markets, including inactive ones (admin views). */
export function useAllMarkets() {
  return useQuery(marketsQueryOptions());
}

export function isShoppable(m: Market) {
  return m.isActive && m.storefrontEnabled && m.prefix !== GLOBAL_PREFIX;
}

/** Active, shoppable country markets (never the global x-default row). */
export function useActiveMarkets(): { markets: Market[]; loaded: boolean } {
  const { data, isLoading } = useQuery(marketsQueryOptions());
  const markets = (data ?? []).filter(isShoppable);
  return { markets, loaded: !isLoading && Boolean(data) };
}

/** The x-default / global market row, when configured. */
export function useDefaultMarket(): Market | null {
  const { data } = useQuery(marketsQueryOptions());
  return (data ?? []).find((m) => m.isDefault) ?? null;
}

/** Historic prefixes that must keep resolving to their new market. */
export const PREFIX_ALIASES: Record<string, string> = {
  usa: "us",
  gb: "uk",
  bgd: "bd",
};

export function resolveMarket(markets: Market[], prefix: string | undefined): Market | null {
  const p = normalizePrefix(prefix);
  if (!p) return null;
  const target = PREFIX_ALIASES[p] ?? p;
  // The global/x-default market lives at "/" and never owns a prefix.
  const list = markets.filter((m) => m.prefix !== GLOBAL_PREFIX);
  return (
    list.find((m) => m.prefix === target) ??
    list.find((m) => m.code === target) ??
    list.find((m) => m.isoCode.toLowerCase() === target) ??
    null
  );
}

/* ------------------------------------------------------------------ */
/* SEO health                                                          */
/* ------------------------------------------------------------------ */

export type SeoHealth = {
  status: "SEO READY" | "NEEDS CONFIGURATION" | "ERROR";
  missing: string[];
};

export function seoHealth(m: Market): SeoHealth {
  const missing: string[] = [];
  const errors: string[] = [];

  if (!m.prefix) errors.push("URL prefix is empty");
  else if (normalizePrefix(m.prefix) !== m.prefix) errors.push("URL prefix is not normalized");
  if (!m.isoCode || m.isoCode.length !== 2) errors.push("ISO code must be 2 letters");
  if (m.canonicalBase && !/^https?:\/\//.test(m.canonicalBase))
    errors.push("Canonical URL must start with http(s)://");
  if (m.hreflang && !/^[a-z]{2}(-[A-Za-z0-9]{2,8})?$|^x-default$/.test(m.hreflang))
    errors.push("Hreflang value is not a valid language tag");

  if (!m.isActive) missing.push("Market is inactive");
  if (!m.locale) missing.push("Locale");
  if (!m.currency) missing.push("Currency");
  if (!m.seoTitle) missing.push("SEO title");
  if (!m.seoDescription) missing.push("Meta description");
  if (!m.hreflang) missing.push("Hreflang");

  if (errors.length) return { status: "ERROR", missing: [...errors, ...missing] };
  if (missing.length) return { status: "NEEDS CONFIGURATION", missing };
  return { status: "SEO READY", missing: [] };
}
