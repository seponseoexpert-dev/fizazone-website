"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    source: "auto",
    selected_product_ids: [],
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
    selected_product_ids: [],
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
    selected_product_ids: [],
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
    source: "auto",
    selected_product_ids: [],
    max_items: 8,
  },
  extra_sections: [],
  features_enabled: true,
};

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  try {
    const res = await fetch("/api/homepage-settings", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch homepage settings");
    const json = await res.json();
    return { ...DEFAULT_HOMEPAGE_CONFIG, ...json };
  } catch (e) {
    console.warn("Using fallback homepage settings:", e);
    return DEFAULT_HOMEPAGE_CONFIG;
  }
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<boolean> {
  const res = await fetch("/api/homepage-settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to save homepage settings");
  }
  return true;
}

export function useHomepageConfig() {
  return useQuery({
    queryKey: ["homepage-config"],
    queryFn: fetchHomepageConfig,
    staleTime: 30_000,
    initialData: DEFAULT_HOMEPAGE_CONFIG,
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
