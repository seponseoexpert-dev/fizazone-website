"use client";

import { useEffect } from "react";
import { useSiteBranding } from "@/lib/site-branding";

export function DynamicFavicon() {
  const { data: branding } = useSiteBranding();

  useEffect(() => {
    const url = branding?.favicon_url;
    if (!url) return;

    // Cache-buster so Chrome is forced to re-fetch and render the new icon in the browser tab
    const bustUrl = url.includes("?") ? `${url}&v=${Date.now()}` : `${url}?v=${Date.now()}`;

    // Remove any existing favicon links
    const existing = document.querySelectorAll<HTMLLinkElement>(
      "link[rel*='icon'], link[rel*='shortcut icon'], link[rel*='apple-touch-icon']"
    );
    existing.forEach((el) => el.remove());

    // Create fresh link elements
    const linkIcon = document.createElement("link");
    linkIcon.rel = "icon";
    linkIcon.type = "image/x-icon";
    linkIcon.href = bustUrl;
    document.head.appendChild(linkIcon);

    const linkShortcut = document.createElement("link");
    linkShortcut.rel = "shortcut icon";
    linkShortcut.type = "image/x-icon";
    linkShortcut.href = bustUrl;
    document.head.appendChild(linkShortcut);

    const linkApple = document.createElement("link");
    linkApple.rel = "apple-touch-icon";
    linkApple.href = bustUrl;
    document.head.appendChild(linkApple);
  }, [branding?.favicon_url]);

  return null;
}
