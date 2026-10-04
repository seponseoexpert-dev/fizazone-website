"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const DEFAULT_BRANDING: SiteBranding = {
  logo_url: "",
  favicon_url: "",
  footer_logo_url: "",
  site_title: "Faiza Zone",
  tagline: "Online Shopping & Gift Store",
  currency_symbol: "৳",
  default_currency: "BDT",
};

export async function fetchSiteBranding(): Promise<SiteBranding> {
  // 1. Check local storage for instantaneous load
  let cached: Partial<SiteBranding> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("fz_site_branding");
      if (raw) {
        cached = JSON.parse(raw);
      }
    } catch {}
  }

  // 2. Fetch both 'site' and 'theme' from site_settings table
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
        cached.logo_url ||
        "";

      const favicon_url =
        (typeof themeRow?.favicon_url === "string" && themeRow.favicon_url) ||
        (typeof siteRow?.favicon_url === "string" && siteRow.favicon_url) ||
        cached.favicon_url ||
        "";

      const footer_logo_url =
        (typeof themeRow?.footer_logo_url === "string" && themeRow.footer_logo_url) ||
        (typeof themeRow?.logo_url === "string" && themeRow.logo_url) ||
        (typeof siteRow?.logo_url === "string" && siteRow.logo_url) ||
        cached.footer_logo_url ||
        "";

      const site_title =
        (typeof siteRow?.site_title === "string" && siteRow.site_title) ||
        cached.site_title ||
        DEFAULT_BRANDING.site_title;

      const tagline =
        (typeof siteRow?.tagline === "string" && siteRow.tagline) ||
        cached.tagline ||
        DEFAULT_BRANDING.tagline;

      const currency_symbol =
        (typeof siteRow?.currency_symbol === "string" && siteRow.currency_symbol) ||
        cached.currency_symbol ||
        DEFAULT_BRANDING.currency_symbol;

      const default_currency =
        (typeof siteRow?.default_currency === "string" && siteRow.default_currency) ||
        cached.default_currency ||
        DEFAULT_BRANDING.default_currency;

      const branding: SiteBranding = {
        logo_url,
        favicon_url,
        footer_logo_url,
        site_title,
        tagline,
        currency_symbol,
        default_currency,
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fz_site_branding", JSON.stringify(branding));
        } catch {}
      }

      return branding;
    }
  } catch (err) {
    console.warn("Error fetching site branding from Supabase:", err);
  }

  // Fallback to cache or default
  return {
    ...DEFAULT_BRANDING,
    ...cached,
  };
}

export function useSiteBranding() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site-branding"],
    queryFn: fetchSiteBranding,
    staleTime: 10 * 1000,
    placeholderData: () => {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("fz_site_branding");
          if (raw) return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
        } catch {}
      }
      return DEFAULT_BRANDING;
    },
    refetchOnWindowFocus: true,
  });

  // Listen for custom update events or storage changes across tabs
  useEffect(() => {
    function handleUpdate() {
      queryClient.invalidateQueries({ queryKey: ["site-branding"] });
    }
    window.addEventListener("fz_site_branding_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("fz_site_branding_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [queryClient]);

  return query;
}

export function updateFaviconInDocument(faviconUrl: string) {
  if (!faviconUrl || typeof document === "undefined") return;

  // 1. Favicon link
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "shortcut icon";
    document.head.appendChild(link);
  }
  link.href = faviconUrl;

  // 2. Apple touch icon
  let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!appleLink) {
    appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    document.head.appendChild(appleLink);
  }
  appleLink.href = faviconUrl;
}
