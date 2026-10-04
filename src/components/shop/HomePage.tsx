"use client";

import { useMemo } from "react";
import { Header } from "@/components/shop/Header";
import {
  Categories,
  Features,
  Footer,
  Hero,
  PromoStrip,
  WinterBanner,
} from "@/components/shop/Sections";
import { BottomNav } from "@/components/shop/BottomNav";
import { DynamicProductSection } from "@/components/shop/DynamicProductSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHomepageConfig } from "@/lib/homepage-config";
import { trendy, ethnic, popular, flashSale, allProducts, type Product } from "./data";

export function HomePage() {
  const { data: config } = useHomepageConfig();

  // Load real products from Supabase database so selected products from Admin Studio match immediately
  const { data: dbProducts } = useQuery({
    queryKey: ["homepage-db-products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, slug, price, sale_price, images, category")
          .limit(100);

        if (error || !data || data.length === 0) return [];
        return data.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images?.[0] || allProducts[0]?.image || "",
          price: p.sale_price ?? p.price,
          oldPrice: p.sale_price ? p.price : undefined,
          rating: 5,
          category: p.category,
          flash: Boolean(p.sale_price),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  // Unified available product list combining DB products and fallbacks
  const availableProductMap = useMemo(() => {
    const map = new Map<string, Product>();
    // 1. Add DB products first
    for (const p of dbProducts ?? []) {
      map.set(p.id, p);
    }
    // 2. Add local fallback products
    for (const p of allProducts) {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    return map;
  }, [dbProducts]);

  // Helper to resolve products for a section
  const getProductsForSection = useMemo(() => {
    return (
      source?: "auto" | "selected" | "category",
      selectedIds?: string[],
      categoryFilter?: string,
      fallbackProducts = trendy,
      maxItems = 8,
    ) => {
      let list = fallbackProducts;
      if (source === "selected" && selectedIds && selectedIds.length > 0) {
        const ordered = selectedIds
          .map((id) => availableProductMap.get(id))
          .filter(Boolean) as Product[];
        if (ordered.length > 0) {
          list = ordered;
        }
      } else if (source === "category" && categoryFilter) {
        const catMatched = Array.from(availableProductMap.values()).filter(
          (p) => p.category?.toLowerCase() === categoryFilter.toLowerCase(),
        );
        if (catMatched.length > 0) {
          list = catMatched;
        }
      } else if (source === "auto" && dbProducts && dbProducts.length > 0) {
        list = dbProducts;
      }
      return list.slice(0, maxItems || 8);
    };
  }, [availableProductMap, dbProducts]);

  const trendingProducts = getProductsForSection(
    config?.trending?.source,
    config?.trending?.selected_product_ids,
    config?.trending?.category_filter,
    trendy,
    config?.trending?.max_items,
  );

  const ethnicProducts = getProductsForSection(
    config?.ethnic?.source,
    config?.ethnic?.selected_product_ids,
    config?.ethnic?.category_filter,
    ethnic,
    config?.ethnic?.max_items,
  );

  const flashSaleProducts = getProductsForSection(
    config?.flash_sale?.source,
    config?.flash_sale?.selected_product_ids,
    config?.flash_sale?.category_filter,
    flashSale,
    config?.flash_sale?.max_items,
  );

  const popularProducts = getProductsForSection(
    config?.popular?.source,
    config?.popular?.selected_product_ids,
    config?.popular?.category_filter,
    popular,
    config?.popular?.max_items,
  );

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />
      <main>
        {/* 1. Hero Slides */}
        <Hero />

        {/* 2. Shop by Categories */}
        <Categories />

        {/* 3. Promo Advertisements Strip */}
        <PromoStrip />

        {/* 4. Trending Now */}
        {config?.trending?.is_active !== false && (
          <DynamicProductSection
            title={config?.trending?.name || "Trendy Now"}
            actionText={config?.trending?.action_label || "View all"}
            actionLink={config?.trending?.action_link || "/categories"}
            layout={config?.trending?.layout || "grid_4"}
            products={trendingProducts}
          />
        )}

        {/* 5. Mid-page Banner */}
        <WinterBanner />

        {/* 6. Ethnic Collection */}
        {config?.ethnic?.is_active !== false && (
          <DynamicProductSection
            title={config?.ethnic?.name || "Ethnic Collection"}
            actionText={config?.ethnic?.action_label || "View all"}
            actionLink={config?.ethnic?.action_link || "/categories"}
            layout={config?.ethnic?.layout || "grid_4"}
            products={ethnicProducts}
          />
        )}

        {/* 7. Flash Sale */}
        {config?.flash_sale?.is_active !== false && (
          <DynamicProductSection
            title={config?.flash_sale?.name || "Flash Sale"}
            actionText={config?.flash_sale?.action_label}
            actionLink={config?.flash_sale?.action_link || "/categories"}
            layout={config?.flash_sale?.layout || "grid_4"}
            products={flashSaleProducts}
          />
        )}

        {/* 8. Most Popular */}
        {config?.popular?.is_active !== false && (
          <DynamicProductSection
            title={config?.popular?.name || "Most Popular"}
            actionText={config?.popular?.action_label}
            actionLink={config?.popular?.action_link || "/categories"}
            layout={config?.popular?.layout || "grid_4"}
            products={popularProducts}
          />
        )}

        {/* 9. Extra Custom Sections Added in Admin */}
        {config?.extra_sections?.map((sec) => {
          if (!sec.is_active) return null;
          const prods = getProductsForSection(
            sec.source,
            sec.selected_product_ids,
            sec.category_filter,
            allProducts,
            sec.max_items,
          );
          return (
            <DynamicProductSection
              key={sec.id}
              title={sec.name}
              actionText={sec.action_label}
              actionLink={sec.action_link || "/categories"}
              layout={sec.layout || "grid_4"}
              products={prods}
            />
          );
        })}

        {/* 10. Service Features */}
        {config?.features_enabled !== false && <Features />}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
