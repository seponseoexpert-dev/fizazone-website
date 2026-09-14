import { notFound, redirect } from "next/navigation";
import { getMarkets } from "@/lib/markets.functions";
import { isShoppable, normalizePrefix, resolveMarket } from "@/lib/markets";
import { ComingSoon } from "@/components/shop/ComingSoon";
import { MarketSync } from "./MarketSync";

export default async function MarketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}) {
  const { market: marketParam } = await params;

  // Ignore admin and static routes if accidentally matched
  if (marketParam === "admin" || marketParam === "api") {
    return <>{children}</>;
  }

  const markets = await getMarkets();
  const market = resolveMarket(markets, marketParam);

  if (!market) {
    notFound();
  }

  const requested = normalizePrefix(marketParam);
  if (requested !== market.prefix) {
    redirect(`/${market.prefix}`);
  }

  if (!isShoppable(market)) {
    return <ComingSoon code={market.prefix} name={market.name} />;
  }

  return (
    <>
      <MarketSync prefix={market.prefix} isShoppable={true} />
      {children}
    </>
  );
}
