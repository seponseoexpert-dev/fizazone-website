"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CategoryItemConfig = {
  id: string;
  name: string;
  image?: string;
  is_active: boolean;
};

export type PromoAdItem = {
  id: string;
  title: string;
  tag?: string;
  badge?: string;
  description?: string;
  image: string;
  link: string;
  bg_color: string;
  is_active: boolean;
};

export type PromoBannerItem = {
  id: string;
  image: string;
  tag: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  align: "right" | "left" | "center";
  is_active: boolean;
};

export type ProductSectionLayout =
  | "grid_4"
  | "grid_3"
  | "carousel"
  | "featured"
  | "two_column";

export type ProductSectionConfig = {
  id: string;
  key: string;
  name: string;
  action_label?: string;
  action_link?: string;
  is_active: boolean;
  layout: ProductSectionLayout;
  source: "auto" | "selected" | "category";
  category_filter?: string;
  selected_product_ids?: string[];
  max_items?: number;
};

export type CategoriesSectionConfig = {
  enabled: boolean;
  title: string;
  mode: "all" | "selected";
  layout: "grid_8" | "grid_4" | "carousel" | "rounded";
  items: CategoryItemConfig[];
};

export type PromoStripSectionConfig = {
  enabled: boolean;
  title?: string;
  items: PromoAdItem[];
};

export type MidBannerSectionConfig = {
  enabled: boolean;
  banners: PromoBannerItem[];
};

export type HomepageConfig = {
  hero_enabled: boolean;
  categories: CategoriesSectionConfig;
  promo_strip: PromoStripSectionConfig;
  trending: ProductSectionConfig;
  mid_banner: MidBannerSectionConfig;
  ethnic: ProductSectionConfig;
  flash_sale: ProductSectionConfig;
  popular: ProductSectionConfig;
  extra_sections: ProductSectionConfig[];
  features_enabled: boolean;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  hero_enabled: true,
  categories: {
    enabled: true,
    title: "Shop by Categories",
    mode: "all",
    layout: "grid_8",
    items: [
      { id: "cat-1", name: "Men", is_active: true },
      { id: "cat-2", name: "Women", is_active: true },
      { id: "cat-3", name: "Kurti", is_active: true },
      { id: "cat-4", name: "Panjabi", is_active: true },
      { id: "cat-5", name: "Boys", is_active: true },
      { id: "cat-6", name: "T-shirt", is_active: true },
      { id: "cat-7", name: "Pants", is_active: true },
      { id: "cat-8", name: "Bags", is_active: true },
    ],
  },
  promo_strip: {
    enabled: true,
    title: "",
    items: [
      {
        id: "promo-1",
        title: "Exclusive for Man",
        tag: "Winter",
        badge: "2026-27",
        description: "Available in store & online",
        image: "",
        link: "/categories?category=Men",
        bg_color: "bg-brand-blush",
        is_active: true,
      },
      {
        id: "promo-2",
        title: "Exclusive for Woman",
        tag: "Winter",
        badge: "2026-27",
        description: "Available in store & online",
        image: "",
        link: "/categories?category=Women",
        bg_color: "bg-brand-sky",
        is_active: true,
      },
      {
        id: "promo-3",
        title: "Exclusive for Kids",
        tag: "Winter",
        badge: "2026-27",
        description: "Available in store & online",
        image: "",
        link: "/categories?category=Boys",
        bg_color: "bg-secondary",
        is_active: true,
      },
    ],
  },
  trending: {
    id: "sec-trending",
    key: "trending",
    name: "Trendy Now",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "selected",
    selected_product_ids: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"],
    max_items: 8,
  },
  mid_banner: {
    enabled: true,
    banners: [
      {
        id: "banner-1",
        image: "",
        tag: "Winter",
        title: "Collection",
        description: "Insulated layers, heavy knits and weather-ready outerwear.",
        button_text: "SHOP NOW",
        button_link: "/categories",
        align: "right",
        is_active: true,
      },
    ],
  },
  ethnic: {
    id: "sec-ethnic",
    key: "ethnic",
    name: "Ethnic Collection",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "auto",
    category_filter: "Kurti",
    selected_product_ids: ["e1", "e2", "e3", "e4"],
    max_items: 8,
  },
  flash_sale: {
    id: "sec-flash",
    key: "flash_sale",
    name: "Flash Sale",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "auto",
    selected_product_ids: ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"],
    max_items: 8,
  },
  popular: {
    id: "sec-popular",
    key: "popular",
    name: "Most Popular",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "selected",
    selected_product_ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
    max_items: 8,
  },
  extra_sections: [],
  features_enabled: true,
};

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  // 1. Direct Supabase read from site_settings (works in browser & server for all visitors)
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_config")
      .maybeSingle();

    if (!error && data?.value && typeof data.value === "object" && Object.keys(data.value).length > 0) {
      const val = data.value as Partial<HomepageConfig>;
      const merged: HomepageConfig = {
        ...DEFAULT_HOMEPAGE_CONFIG,
        ...val,
        categories: { ...DEFAULT_HOMEPAGE_CONFIG.categories, ...(val.categories || {}) },
        promo_strip: { ...DEFAULT_HOMEPAGE_CONFIG.promo_strip, ...(val.promo_strip || {}) },
        trending: { ...DEFAULT_HOMEPAGE_CONFIG.trending, ...(val.trending || {}) },
        mid_banner: { ...DEFAULT_HOMEPAGE_CONFIG.mid_banner, ...(val.mid_banner || {}) },
        ethnic: { ...DEFAULT_HOMEPAGE_CONFIG.ethnic, ...(val.ethnic || {}) },
        flash_sale: { ...DEFAULT_HOMEPAGE_CONFIG.flash_sale, ...(val.flash_sale || {}) },
        popular: { ...DEFAULT_HOMEPAGE_CONFIG.popular, ...(val.popular || {}) },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fz_homepage_config", JSON.stringify(merged));
        } catch {}
      }
      return merged;
    }
  } catch (err) {
    console.warn("Direct Supabase fetch error:", err);
  }

  // 2. Read from localStorage cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("fz_homepage_config");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          return {
            ...DEFAULT_HOMEPAGE_CONFIG,
            ...parsed,
            categories: { ...DEFAULT_HOMEPAGE_CONFIG.categories, ...(parsed.categories || {}) },
            promo_strip: { ...DEFAULT_HOMEPAGE_CONFIG.promo_strip, ...(parsed.promo_strip || {}) },
            trending: { ...DEFAULT_HOMEPAGE_CONFIG.trending, ...(parsed.trending || {}) },
            mid_banner: { ...DEFAULT_HOMEPAGE_CONFIG.mid_banner, ...(parsed.mid_banner || {}) },
            ethnic: { ...DEFAULT_HOMEPAGE_CONFIG.ethnic, ...(parsed.ethnic || {}) },
            flash_sale: { ...DEFAULT_HOMEPAGE_CONFIG.flash_sale, ...(parsed.flash_sale || {}) },
            popular: { ...DEFAULT_HOMEPAGE_CONFIG.popular, ...(parsed.popular || {}) },
          };
        }
      }
    } catch {}
  }

  // 3. Fallback to API route
  try {
    const res = await fetch("/api/homepage-settings", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json && typeof json === "object" && Object.keys(json).length > 0) {
        return {
          ...DEFAULT_HOMEPAGE_CONFIG,
          ...json,
          categories: { ...DEFAULT_HOMEPAGE_CONFIG.categories, ...(json.categories || {}) },
          promo_strip: { ...DEFAULT_HOMEPAGE_CONFIG.promo_strip, ...(json.promo_strip || {}) },
          trending: { ...DEFAULT_HOMEPAGE_CONFIG.trending, ...(json.trending || {}) },
          mid_banner: { ...DEFAULT_HOMEPAGE_CONFIG.mid_banner, ...(json.mid_banner || {}) },
          ethnic: { ...DEFAULT_HOMEPAGE_CONFIG.ethnic, ...(json.ethnic || {}) },
          flash_sale: { ...DEFAULT_HOMEPAGE_CONFIG.flash_sale, ...(json.flash_sale || {}) },
          popular: { ...DEFAULT_HOMEPAGE_CONFIG.popular, ...(json.popular || {}) },
        };
      }
    }
  } catch {}

  return DEFAULT_HOMEPAGE_CONFIG;
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<boolean> {
  // 1. Direct Supabase upsert using current user session
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "homepage_config", value: config as never }, { onConflict: "key" });

  if (error) {
    console.error("Supabase site_settings upsert error:", error);
    throw new Error(error.message || "Failed to save homepage settings in Supabase");
  }

  // 2. Always persist in localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fz_homepage_config", JSON.stringify(config));
    } catch {}
  }

  // 3. Also notify API route for server sync
  try {
    await fetch("/api/homepage-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  } catch {}

  return true;
}

export function useHomepageConfig() {
  return useQuery({
    queryKey: ["homepage-config"],
    queryFn: fetchHomepageConfig,
    staleTime: 0,
    placeholderData: DEFAULT_HOMEPAGE_CONFIG,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useSaveHomepageConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveHomepageConfig,
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["homepage-config"], variables);
      queryClient.invalidateQueries({ queryKey: ["homepage-config"] });
    },
  });
}
