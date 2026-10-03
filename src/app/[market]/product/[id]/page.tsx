import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/shop/ProductView";
import { fetchShopProducts, findProductByIdOrSlug } from "@/lib/catalog";
import { getMarkets } from "@/lib/markets.functions";
import { resolveMarket } from "@/lib/markets";
import { richTextToPlain } from "@/lib/rich-text";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; id: string }>;
}): Promise<Metadata> {
  const { market: marketParam, id } = await params;
  try {
    const [all, markets] = await Promise.all([
      fetchShopProducts(marketParam),
      getMarkets(),
    ]);
    const product = findProductByIdOrSlug(all, id);
    if (!product) {
      return { title: "Product unavailable — Faiza Zone", robots: { index: false } };
    }
    const market = resolveMarket(markets, marketParam);
    const summary = richTextToPlain(product.description).replace(/\s+/g, " ").slice(0, 155);
    const description =
      summary ||
      `Buy ${product.name} at Faiza Zone${market ? ` ${market.name}` : ""} with fast delivery.`;
    const image = product.images?.[0] || undefined;

    return {
      title: `${product.name} — Faiza Zone`,
      description,
      openGraph: {
        title: product.name,
        description,
        type: "website",
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: "Product — Faiza Zone",
    };
  }
}

export default async function MarketProductPage({
  params,
}: {
  params: Promise<{ market: string; id: string }>;
}) {
  const { market: marketParam, id } = await params;
  const [all, markets] = await Promise.all([
    fetchShopProducts(marketParam),
    getMarkets(),
  ]);
  const product = findProductByIdOrSlug(all, id);
  if (!product) {
    notFound();
  }

  const market = resolveMarket(markets, marketParam);
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: richTextToPlain(product.description).replace(/\s+/g, " ").slice(0, 155),
    image: product.images ?? [],
    sku: product.slug || product.id,
    brand: { "@type": "Brand", name: "Faiza Zone" },
    offers: {
      "@type": "Offer",
      price: String(product.price),
      priceCurrency: market?.currency ?? "BDT",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductView product={product} related={related} />
    </>
  );
}
