import type { Metadata } from "next";
import { HomePage } from "@/components/shop/HomePage";
import { getMarkets } from "@/lib/markets.functions";
import { resolveMarket } from "@/lib/markets";
import { fetchSeoMetaForPage, buildMarketHreflang } from "@/lib/seo";
import { fetchServerHomepageConfig } from "@/lib/homepage-config-server";
import { fetchSiteBanners } from "@/lib/site-content";
import { fetchShopProducts } from "@/lib/catalog";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market: marketParam } = await params;
  try {
    const [markets, customSeo] = await Promise.all([
      getMarkets(),
      fetchSeoMetaForPage("home", "home", marketParam),
    ]);
    const market = resolveMarket(markets, marketParam);
    if (!market) {
      return { robots: { index: false } };
    }

    const fallbackTitle = `Faiza Zone ${market.name ?? ""} — Fashion, Footwear & Accessories`.trim();
    const fallbackDescription =
      market.seoDescription ||
      `Shop trending kurti, panjabi, hoodies, sneakers and accessories at Faiza Zone${market ? ` ${market.name}` : ""}.`;

    const title = customSeo?.meta_title || market.seoTitle || fallbackTitle;
    const description = customSeo?.meta_description || fallbackDescription;
    const canonical = customSeo?.canonical_url || `https://faizazone.com/${market.prefix}`;

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: buildMarketHreflang(),
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: canonical,
        siteName: "Faiza Zone",
        images: [
          {
            url: "/og-image.jpg",
            width: 1200,
            height: 630,
            alt: `Faiza Zone ${market.name}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        site: "@faizazone",
        images: ["/og-image.jpg"],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Faiza Zone",
      alternates: {
        canonical: `https://faizazone.com/${marketParam}`,
        languages: buildMarketHreflang(),
      },
    };
  }
}

export default async function MarketHomePage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market: marketParam } = await params;

  const [initialConfig, initialBanners, initialProducts] = await Promise.all([
    fetchServerHomepageConfig(),
    fetchSiteBanners(marketParam),
    fetchShopProducts(marketParam),
  ]);

  return (
    <HomePage
      initialConfig={initialConfig}
      initialBanners={initialBanners}
      initialProducts={initialProducts}
    />
  );
}
