import { redirect } from "next/navigation";

export default async function MarketCatchAllPage({
  params,
}: {
  params: Promise<{ market: string; slug: string[] }>;
}) {
  const { market } = await params;
  redirect(`/${market}`);
}
