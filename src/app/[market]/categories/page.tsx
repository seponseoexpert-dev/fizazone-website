import type { Metadata } from "next";
import { CategoriesView } from "@/components/shop/CategoriesView";
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
    const marketName = market?.name ?? "your market";
    const title = `Shop Product Categories — Faiza Zone ${marketName}`.trim();
    const description = `Browse Faiza Zone categories in ${marketName}: men, women, kurti, panjabi, boys, t-shirts, pants and bags.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Shop Product Categories — Faiza Zone",
    };
  }
}

export default function MarketCategoriesPage() {
  return <CategoriesView />;
}
