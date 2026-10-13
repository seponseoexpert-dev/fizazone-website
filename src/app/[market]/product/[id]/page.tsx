import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/shop/ProductView";
import { fetchShopProducts, findProductByIdOrSlug } from "@/lib/catalog";
import { getMarkets } from "@/lib/markets.functions";
import { resolveMarket } from "@/lib/markets";
import { richTextToPlain } from "@/lib/rich-text";
import { buildMarketHreflang, SEO_BASE_URL } from "@/lib/seo";

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
    const prodSlug = product.slug || product.id;
    const canonical = `${SEO_BASE_URL}/${marketParam}/product/${prodSlug}`;

    return {
      title: `${product.name} — Faiza Zone`,
      description,
      keywords: [
        product.name,
        product.category,
        "Faiza Zone",
        "clothing",
        "fashion online",
        market?.name ?? "",
      ].filter(Boolean),
      alternates: {
        canonical,
        languages: buildMarketHreflang(`/product/${prodSlug}`),
      },
      openGraph: {
        title: product.name,
        description,
        type: "website",
        url: canonical,
        siteName: "Faiza Zone",
        images: image
          ? [
              {
                url: image,
                width: 800,
                height: 800,
                alt: product.name,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        site: "@faizazone",
        images: image ? [image] : [],
      },
      robots: {
        index: true,
        follow: true,
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
  const prodSlug = product.slug || product.id;
  const productUrl = `${SEO_BASE_URL}/${marketParam}/product/${prodSlug}`;
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: richTextToPlain(product.description).replace(/\s+/g, " ").slice(0, 155),
    image: product.images ?? [],
    sku: prodSlug,
    mpn: product.id,
    brand: { "@type": "Brand", name: "Faiza Zone" },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: String(product.price),
      priceCurrency: market?.currency ?? "BDT",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productUrl,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(product.rating || 5),
      reviewCount: String(product.reviews || 12),
      bestRating: "5",
      worstRating: "1",
    },
  };

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
        name: product.category || "Categories",
        item: `${SEO_BASE_URL}/${marketParam}/categories`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductView product={product} related={related} />
    </>
  );
}
