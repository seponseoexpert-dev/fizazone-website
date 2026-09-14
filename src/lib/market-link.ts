"use client";

/**
 * Market-aware link helpers.
 *
 * Every public storefront URL carries a market prefix (/bd, /uk, /us …).
 * These helpers resolve the prefix for the current view so internal links
 * never fall back to the legacy non-market URLs.
 */
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useCountry } from "@/lib/country";
import { isShoppable, marketsQueryOptions, normalizePrefix, resolveMarket } from "@/lib/markets";

/** URL prefix of the market currently being browsed. */
export function useMarketPrefix(): string {
  const pathname = usePathname() || "/";
  const { data } = useQuery(marketsQueryOptions());
  const { country } = useCountry();

  const markets = (data ?? []).filter(isShoppable);
  const first = normalizePrefix(pathname.split("/")[1] ?? "");

  return (
    resolveMarket(markets, first)?.prefix ??
    resolveMarket(markets, country.code)?.prefix ??
    markets.find((m) => m.isDefault)?.prefix ??
    markets[0]?.prefix ??
    normalizePrefix(country.code) ??
    "bd"
  );
}

/** The SEO-friendly public identifier for a product (slug, never the UUID). */
export function productSlug(product: { slug?: string | null; id: string }): string {
  return product.slug || product.id;
}

/** Link props for a market-aware product page. */
export function productLinkProps(
  market: string,
  product: { slug?: string | null; id: string },
) {
  const slug = productSlug(product);
  const href = `/${market}/product/${slug}`;
  return { href, to: href } as const;
}
