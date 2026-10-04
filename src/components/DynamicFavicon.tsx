"use client";

import { useEffect } from "react";
import { useSiteBranding, updateFaviconInDocument } from "@/lib/site-branding";

export function DynamicFavicon() {
  const { data: branding } = useSiteBranding();

  useEffect(() => {
    if (branding?.favicon_url) {
      updateFaviconInDocument(branding.favicon_url);
    }
  }, [branding?.favicon_url]);

  return null;
}
