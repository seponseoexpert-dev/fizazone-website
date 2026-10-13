import type { Metadata } from "next";
import { HomePage } from "@/components/shop/HomePage";
import { getMarkets } from "@/lib/markets.functions";
import { fetchSeoMetaForPage, buildMarketHreflang } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const fallbackTitle = "Faiza Zone — Fashion, Footwear & Accessories Online";
  const fallbackDescription =
    "Shop trending kurti, panjabi, hoodies, sneakers and accessories at Faiza Zone. Flash sales up to 50% off with fast worldwide delivery.";

  try {
    const [markets, customSeo] = await Promise.all([
      getMarkets(),
      fetchSeoMetaForPage("home", "home", "bd"),
    ]);
    const global = markets.find((m) => m.isDefault);
    const title = customSeo?.meta_title || global?.seoTitle || fallbackTitle;
    const description = customSeo?.meta_description || global?.seoDescription || fallbackDescription;
    const canonical = customSeo?.canonical_url || "https://faizazone.com";

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
        url: "https://faizazone.com",
        siteName: "Faiza Zone",
        images: [
          {
            url: "/og-image.jpg",
            width: 1200,
            height: 630,
            alt: "Faiza Zone Fashion Store",
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
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical: "https://faizazone.com",
        languages: buildMarketHreflang(),
      },
    };
  }
}

export default function RootPage() {
  return <HomePage />;
}
