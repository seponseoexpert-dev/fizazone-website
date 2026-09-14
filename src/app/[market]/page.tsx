import type { Metadata } from "next";
import { HomePage } from "@/components/shop/HomePage";
import { getMarkets } from "@/lib/markets.functions";
import { resolveMarket } from "@/lib/markets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market: marketParam } = await params;
  try {
    const markets = await getMarkets();
    const market = resolveMarket(markets, marketParam);
    if (!market) {
      return { robots: { index: false } };
    }

    const title = `Faiza Zone ${market.name ?? ""} — Fashion, Footwear & Accessories`.trim();
    const description =
      market.seoDescription ||
      `Shop trending kurti, panjabi, hoodies, sneakers and accessories at Faiza Zone${market ? ` ${market.name}` : ""}.`;

    return {
      title: market.seoTitle || title,
      description,
      openGraph: {
        title: market.seoTitle || title,
        description,
        type: "website",
        siteName: "Faiza Zone",
      },
      twitter: {
        card: "summary_large_image",
        site: "@faizazone",
      },
    };
  } catch {
    return {
      title: "Faiza Zone",
    };
  }
}

export default function MarketHomePage() {
  return <HomePage />;
}
