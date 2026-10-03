import { redirect } from "next/navigation";
import { fetchShopProducts, findProductByIdOrSlug } from "@/lib/catalog";
import { getMarkets } from "@/lib/markets.functions";
import { isShoppable } from "@/lib/markets";

export default async function LegacyProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [all, markets] = await Promise.all([fetchShopProducts(), getMarkets()]);
  const shoppable = markets.filter(isShoppable);
  const target = shoppable.find((m) => m.isDefault) ?? shoppable[0];
  const prefix = target?.prefix ?? "bd";
  const product = findProductByIdOrSlug(all, id);

  redirect(
    product ? `/${prefix}/product/${product.slug || product.id}` : `/${prefix}/categories`,
  );
}
