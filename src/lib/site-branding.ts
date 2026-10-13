"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_BRANDING,
  fetchServerSiteBranding,
  type SiteBranding,
} from "./site-branding-server";

export { DEFAULT_BRANDING, type SiteBranding };

export async function fetchSiteBranding(): Promise<SiteBranding> {
  const branding = await fetchServerSiteBranding();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fz_site_branding", JSON.stringify(branding));
    } catch {}
  }
  return branding;
}

export function useSiteBranding(initialData?: SiteBranding) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site-branding"],
    queryFn: fetchSiteBranding,
    staleTime: 60 * 1000,
    initialData: initialData ?? (() => queryClient.getQueryData<SiteBranding>(["site-branding"])),
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
