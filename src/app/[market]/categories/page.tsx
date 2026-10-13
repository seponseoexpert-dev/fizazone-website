import type { Metadata } from "next";
import { CategoriesView } from "@/components/shop/CategoriesView";
import { getMarkets } from "@/lib/markets.functions";
import { resolveMarket } from "@/lib/markets";
import { buildMarketHreflang, SEO_BASE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market: marketParam } = await params;
  try {
    const markets = await getMarkets();
    const market = resolveMarket(markets, marketParam);
    const marketName = market?.name ?? "your market";
    const title = `Shop Product Categories — Faiza Zone ${marketName}`.trim();
    const description = `Browse Faiza Zone categories in ${marketName}: men, women, kurti, panjabi, boys, t-shirts, pants and bags with fast delivery.`;
    const canonical = `${SEO_BASE_URL}/${marketParam}/categories`;

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: buildMarketHreflang("/categories"),
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
            alt: `Faiza Zone Categories - ${marketName}`,
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
      title: "Shop Product Categories — Faiza Zone",
      alternates: {
        canonical: `${SEO_BASE_URL}/${marketParam}/categories`,
        languages: buildMarketHreflang("/categories"),
      },
    };
  }
}

export default async function MarketCategoriesPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market: marketParam } = await params;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SEO_BASE_URL}/${marketParam}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${SEO_BASE_URL}/${marketParam}/categories`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Faiza Zone Product Categories",
    url: `${SEO_BASE_URL}/${marketParam}/categories`,
    description: "Browse curated fashion categories: men, women, ethnic wear, footwear, and accessories.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <CategoriesView />
    </>
  );
}
