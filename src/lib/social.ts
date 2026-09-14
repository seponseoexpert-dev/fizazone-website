// Shared Open Graph / Twitter Card metadata helpers.
// Every public route should use socialMeta() so SEO title/description
// are reused for og:title / og:description / twitter:title / twitter:description.
import { isShoppable, type Market } from "@/lib/markets";

export const SITE_URL = "https://faizazone.com";
export const SITE_NAME = "Faiza Zone";
export const TWITTER_HANDLE = "@faizazone";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

type SocialMetaInput = {
  title: string;
  description: string;
  /** Route path beginning with "/", e.g. "/categories" */
  path: string;
  ogType?: string;
  /** Absolute image URL; falls back to the branded default card */
  image?: string | undefined;
  /** Robots directive, e.g. "noindex" for private pages */
  robots?: string | undefined;
  /** Extra <link> tags (hreflang alternates) */
  extraLinks?: { rel: string; href: string; hrefLang?: string }[];
};

export function socialMeta({
  title,
  description,
  path,
  ogType = "website",
  image,
  robots,
  extraLinks,
}: SocialMetaInput) {
  const url = `${SITE_URL}${path}`;
  const img = image || DEFAULT_OG_IMAGE;
  const meta = [
    { title },
    { name: "description", content: description },
    ...(robots ? [{ name: "robots", content: robots }] : []),
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: img },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: title },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: img },
    { name: "twitter:image:alt", content: title },
  ];
  return {
    meta,
    links: [{ rel: "canonical", href: url }, ...(extraLinks ?? [])],
  };
}

/* ------------------------------------------------------------------ */
/* Market-aware SEO                                                    */
/* ------------------------------------------------------------------ */

/** Builds "/bd/product/123" from a market prefix and a market-relative path. */
export function marketPath(prefix: string | null | undefined, path = ""): string {
  const clean = path === "/" ? "" : path;
  if (!prefix) return clean || "/";
  return `/${prefix}${clean}`;
}

export function marketUrl(market: Market | null, path = ""): string {
  const base = market?.canonicalBase?.replace(/\/+$/, "") || SITE_URL;
  return `${base}${marketPath(market?.prefix, path)}`;
}

/** hreflang alternates for every active market, plus x-default at the root. */
export function hreflangLinks(markets: Market[], path = "") {
  const links = markets.filter(isShoppable).map((m) => ({
    rel: "alternate",
    hrefLang: m.hreflang || m.locale || m.isoCode.toLowerCase(),
    href: marketUrl(m, path),
  }));
  // The root "/" only serves the global home page; deeper paths (e.g. product
  // pages) exist per market, so x-default points at the default market there.
  const fallback = markets.find((m) => m.isDefault && isShoppable(m)) ?? markets.filter(isShoppable)[0];
  const xDefault = path && fallback ? marketUrl(fallback, path) : `${SITE_URL}${path || "/"}`;
  links.push({ rel: "alternate", hrefLang: "x-default", href: xDefault });
  return links;
}

type MarketMetaInput = {
  market: Market | null;
  markets: Market[];
  /** Market-relative path, "" for the market home page */
  path?: string;
  title: string;
  description: string;
  ogType?: string;
  image?: string | undefined;
  robots?: string | undefined;
};

/**
 * Per-market metadata: self-referencing canonical, DB-configured title /
 * description / OG overrides, and dynamically generated hreflang alternates.
 */
export function marketMeta({
  market,
  markets,
  path = "",
  title,
  description,
  ogType,
  image,
  robots,
}: MarketMetaInput) {
  const suffix = market ? ` | ${SITE_NAME} ${market.name}` : ` | ${SITE_NAME}`;
  const finalTitle = path
    ? `${title}${title.includes(SITE_NAME) ? "" : suffix}`
    : market?.seoTitle || title;
  const finalDescription = (path ? description : market?.seoDescription || description) || description;
  const url = marketUrl(market, path);

  const base = socialMeta({
    title: finalTitle,
    description: finalDescription,
    path: "",
    ...(ogType ? { ogType } : {}),
    image: image || market?.ogImage || undefined,
    robots,
    extraLinks: hreflangLinks(markets, path),
  });

  // Point canonical + og:url at this exact market URL.
  const meta = base.meta.map((m) => {
    if ("property" in m && m.property === "og:url") return { property: "og:url", content: url };
    if ("property" in m && m.property === "og:title" && market?.ogTitle && !path)
      return { property: "og:title", content: market.ogTitle };
    if ("property" in m && m.property === "og:description" && market?.ogDescription && !path)
      return { property: "og:description", content: market.ogDescription };
    return m;
  });
  const links = base.links.map((l) => (l.rel === "canonical" ? { rel: "canonical", href: url } : l));
  return { meta, links };
}
