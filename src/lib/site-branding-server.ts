import { supabase } from "@/integrations/supabase/client";

export type SiteBranding = {
  logo_url: string;
  favicon_url: string;
  footer_logo_url: string;
  site_title: string;
  tagline: string;
  currency_symbol: string;
  default_currency: string;
};

export const DEFAULT_BRANDING: SiteBranding = {
  logo_url: "",
  favicon_url: "",
  footer_logo_url: "",
  site_title: "Faiza Zone",
  tagline: "Online Shopping & Gift Store",
  currency_symbol: "৳",
  default_currency: "BDT",
};

export async function fetchServerSiteBranding(): Promise<SiteBranding> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site", "theme"]);

    if (!error && data && data.length > 0) {
      const siteRow = data.find((r) => r.key === "site")?.value as Record<string, unknown> | undefined;
      const themeRow = data.find((r) => r.key === "theme")?.value as Record<string, unknown> | undefined;

      const logo_url =
        (typeof themeRow?.logo_url === "string" && themeRow.logo_url) ||
        (typeof siteRow?.logo_url === "string" && siteRow.logo_url) ||
        "";

      const favicon_url =
        (typeof themeRow?.favicon_url === "string" && themeRow.favicon_url) ||
        (typeof siteRow?.favicon_url === "string" && siteRow.favicon_url) ||
        "";

      const footer_logo_url =
        (typeof themeRow?.footer_logo_url === "string" && themeRow.footer_logo_url) ||
        (typeof themeRow?.logo_url === "string" && themeRow.logo_url) ||
        (typeof siteRow?.logo_url === "string" && siteRow.logo_url) ||
        "";

      const site_title =
        (typeof siteRow?.site_title === "string" && siteRow.site_title) ||
        DEFAULT_BRANDING.site_title;

      const tagline =
        (typeof siteRow?.tagline === "string" && siteRow.tagline) ||
        DEFAULT_BRANDING.tagline;

      const currency_symbol =
        (typeof siteRow?.currency_symbol === "string" && siteRow.currency_symbol) ||
        DEFAULT_BRANDING.currency_symbol;

      const default_currency =
        (typeof siteRow?.default_currency === "string" && siteRow.default_currency) ||
        DEFAULT_BRANDING.default_currency;

      return {
        logo_url,
        favicon_url,
        footer_logo_url,
        site_title,
        tagline,
        currency_symbol,
        default_currency,
      };
    }
  } catch (err) {
    console.warn("Error fetching server site branding from Supabase:", err);
  }

  return DEFAULT_BRANDING;
}
