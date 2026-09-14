import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/shop/data";
import { getImageSrc } from "@/lib/utils";

import hoodieGrey from "@/assets/p-hoodie-grey.jpg";
import hoodieRed from "@/assets/p-hoodie-red.jpg";
import jeansBlack from "@/assets/p-jeans-black.jpg";
import teeBlack from "@/assets/p-tee-black.jpg";
import teeWhite from "@/assets/p-tee-white.jpg";
import bag from "@/assets/p-bag.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import denim from "@/assets/p-denim.jpg";
import hat from "@/assets/p-hat.jpg";
import heroWomen from "@/assets/hero-style-women.jpg";
import heroMen from "@/assets/hero-style-men.jpg";
import heroJuniors from "@/assets/hero-style-juniors.jpg";
import heroFlashSale from "@/assets/hero-flash-sale.jpg";
import heroShoppingBags from "@/assets/hero-shopping-bags.jpg";
import winterCollection from "@/assets/winter-collection.jpg";
import promoKids from "@/assets/promo-kids.jpg";
import promoMen from "@/assets/promo-men.jpg";
import promoWomen from "@/assets/promo-women.jpg";

const FALLBACKS: Record<string, string> = {
  "p-hoodie-grey": getImageSrc(hoodieGrey),
  "p-hoodie-red": getImageSrc(hoodieRed),
  "p-jeans-black": getImageSrc(jeansBlack),
  "p-tee-black": getImageSrc(teeBlack),
  "p-tee-white": getImageSrc(teeWhite),
  "p-bag": getImageSrc(bag),
  "p-sneakers": getImageSrc(sneakers),
  "p-denim": getImageSrc(denim),
  "p-hat": getImageSrc(hat),
  "hero-style-women": getImageSrc(heroWomen),
  "hero-style-men": getImageSrc(heroMen),
  "hero-style-juniors": getImageSrc(heroJuniors),
  "hero-flash-sale": getImageSrc(heroFlashSale),
  "hero-shopping-bags": getImageSrc(heroShoppingBags),
  "winter-collection": getImageSrc(winterCollection),
  "promo-kids": getImageSrc(promoKids),
  "promo-men": getImageSrc(promoMen),
  "promo-women": getImageSrc(promoWomen),
};

const PLACEHOLDER = getImageSrc(teeWhite);

/** Turns a stored image reference into a usable URL. */
export function resolveImage(raw: string | undefined, seed = ""): string {
  if (!raw) return pickFallback(seed);
  if (raw.startsWith("http")) return raw;
  const base = raw.split("/").pop() ?? raw;
  const key = Object.keys(FALLBACKS).find((k) => base.startsWith(k));
  if (key) return FALLBACKS[key]!;
  if (raw.startsWith("/")) return raw;
  // Uploaded storage object -> public URL (falls back gracefully if bucket is private).
  const { data } = supabase.storage.from("product-images").getPublicUrl(raw);
  return data.publicUrl || pickFallback(seed);
}

function pickFallback(seed: string) {
  if (!seed) return PLACEHOLDER;
  const list = Object.values(FALLBACKS);
  let n = 0;
  for (const ch of seed) n = (n + ch.charCodeAt(0)) % 997;
  return list[n % list.length] ?? PLACEHOLDER;
}

export type ShopProduct = Product & {
  slug: string;
  description: string | null;
  images: string[];
  imageAlts: string[];
  sizes: string[];
  colorNames: string[];
  stock: number;
  createdAt: string;
  /** Per-market shipping cost configured in Admin → Products → Country Content. */
  shippingFee: number;
  /** Currency of the market the price is expressed in. */
  currency?: string;
};

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  sale_price: number | null;
  sizes: string[] | null;
  colors: string[] | null;
  images: string[] | null;
  image_alts?: string[] | null;
  created_at: string;
  product_variants: { stock_qty: number }[] | null;
};

function mapRow(row: Row): ShopProduct {
  const hasSale = row.sale_price != null && Number(row.sale_price) < Number(row.price);
  const price = hasSale ? Number(row.sale_price) : Number(row.price);
  const oldPrice = hasSale ? Number(row.price) : undefined;
  const images = (row.images ?? []).map((img) => resolveImage(img, row.slug));
  const stock = (row.product_variants ?? []).reduce((n, v) => n + (v.stock_qty ?? 0), 0);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: images[0] ?? resolveImage(undefined, row.slug),
    images: images.length ? images : [resolveImage(undefined, row.slug)],
    imageAlts: (row.images ?? []).map((_, i) => (row.image_alts ?? [])[i] || row.name),
    price,
    ...(oldPrice ? { oldPrice } : {}),
    rating: 4 + (row.name.length % 2),
    reviews: 8 + (row.name.length % 40),
    flash: hasSale,
    category: row.category,
    sizes: row.sizes ?? [],
    colorNames: row.colors ?? [],
    stock,
    createdAt: row.created_at,
    shippingFee: 0,
  };
}

/** Per-market overrides: pricing/availability + localized content. */
type MarketRow = {
  product_id: string;
  price: number;
  sale_price: number | null;
  shipping_fee: number | null;
  currency: string;
  stock_qty: number;
  is_visible: boolean;
};
type TranslationRow = {
  product_id: string;
  title: string;
  full_description: string;
  images: string[] | null;
};

function applyMarket(
  product: ShopProduct,
  map: MarketRow | undefined,
  translation: TranslationRow | undefined,
): ShopProduct {
  const next: ShopProduct = { ...product };
  if (translation) {
    if (translation.title) next.name = translation.title;
    if (translation.full_description) next.description = translation.full_description;
    const imgs = (translation.images ?? []).map((i) => resolveImage(i, product.slug));
    if (imgs.length) {
      next.images = imgs;
      next.image = imgs[0]!;
      next.imageAlts = imgs.map(() => next.name);
    }
  }
  if (map) {
    const base = Number(map.price) || product.price;
    const sale = map.sale_price == null ? null : Number(map.sale_price);
    const hasSale = sale != null && sale > 0 && sale < base;
    next.price = hasSale ? sale : base;
    if (hasSale) next.oldPrice = base;
    else delete next.oldPrice;
    next.flash = hasSale;
    next.shippingFee = Number(map.shipping_fee ?? 0) || 0;
    next.currency = map.currency;
    if (map.stock_qty > 0) next.stock = map.stock_qty;
  }
  return next;
}

// Only the columns the storefront renders — keeps the payload small and fast.
const LIST_COLUMNS =
  "id,name,slug,description,category,price,sale_price,sizes,colors,images,image_alts,created_at,product_variants(stock_qty)";

export async function fetchShopProducts(market?: string): Promise<ShopProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const products = ((data ?? []) as unknown as Row[]).map(mapRow);
  if (!market) return products;

  const [{ data: maps }, { data: translations }] = await Promise.all([
    supabase
      .from("product_country_map")
      .select("product_id,price,sale_price,shipping_fee,currency,stock_qty,is_visible")
      .eq("country_code", market),
    supabase
      .from("product_translations")
      .select("product_id,title,full_description,images")
      .eq("country_code", market),
  ]);

  const mapBy = new Map((maps ?? []).map((m) => [m.product_id, m as unknown as MarketRow]));
  const trBy = new Map(
    (translations ?? []).map((t) => [t.product_id, t as unknown as TranslationRow]),
  );

  return products
    .filter((p) => mapBy.get(p.id)?.is_visible !== false)
    .map((p) => applyMarket(p, mapBy.get(p.id), trBy.get(p.id)));
}


export const productsQueryOptions = (market?: string) =>
  queryOptions({
    queryKey: ["shop-products", market ?? "base"],
    queryFn: () => fetchShopProducts(market),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });


/**
 * Market-aware product list. Pass the market prefix from a component
 * (useMarketPrefix) — this module stays free of router imports.
 */
export function useShopProducts(market?: string) {
  return useQuery(productsQueryOptions(market));
}

/** Matches a UI category label (Men, Kurti, Bags…) against real product rows. */
export function matchesCategory(product: ShopProduct, label: string) {
  if (!label || label === "All") return true;
  const l = label.toLowerCase();
  const c = (product.category ?? "").toLowerCase();
  if (c === l) return true;
  if (l === "men" && c === "men") return true;
  if (l === "women" && c === "women") return true;
  if (["boys", "juniors", "kids"].includes(l) && c === "juniors") return true;
  return product.name.toLowerCase().includes(l);
}
