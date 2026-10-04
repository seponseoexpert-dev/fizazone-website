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
import { useHomepageConfig } from "@/lib/homepage-config";
import { trendy, ethnic, popular, flashSale, allProducts } from "./data";

export function HomePage() {
  const { data: config } = useHomepageConfig();

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
        const productMap = new Map(allProducts.map((p) => [p.id, p]));
        const ordered = selectedIds.map((id) => productMap.get(id)).filter(Boolean) as typeof allProducts;
        if (ordered.length > 0) {
          list = ordered;
        }
      } else if (source === "category" && categoryFilter) {
        const catMatched = allProducts.filter(
          (p) => p.category?.toLowerCase() === categoryFilter.toLowerCase(),
        );
        if (catMatched.length > 0) {
          list = catMatched;
        }
      }
      return list.slice(0, maxItems || 8);
    };
  }, []);

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
