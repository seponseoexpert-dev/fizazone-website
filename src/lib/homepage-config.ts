"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  fetchServerHomepageConfig,
  type HomepageConfig,
  type CategoryItemConfig,
  type PromoAdItem,
  type PromoBannerItem,
  type ProductSectionLayout,
  type ProductSectionConfig,
  type CategoriesSectionConfig,
  type PromoStripSectionConfig,
  type MidBannerSectionConfig,
} from "./homepage-config-server";

export {
  DEFAULT_HOMEPAGE_CONFIG,
  type HomepageConfig,
  type CategoryItemConfig,
  type PromoAdItem,
  type PromoBannerItem,
  type ProductSectionLayout,
  type ProductSectionConfig,
  type CategoriesSectionConfig,
  type PromoStripSectionConfig,
  type MidBannerSectionConfig,
};

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  const config = await fetchServerHomepageConfig();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fz_homepage_config", JSON.stringify(config));
    } catch {}
  }
  return config;
}

export async function saveHomepageConfig(config: HomepageConfig): Promise<boolean> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "homepage_config", value: config as never }, { onConflict: "key" });

  if (error) {
    console.error("Supabase site_settings upsert error:", error);
    throw new Error(error.message || "Failed to save homepage settings in Supabase");
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fz_homepage_config", JSON.stringify(config));
    } catch {}
  }

  try {
    await fetch("/api/homepage-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  } catch {}

  return true;
}

export function useHomepageConfig(initialData?: HomepageConfig) {
  return useQuery({
    queryKey: ["homepage-config"],
    queryFn: fetchHomepageConfig,
    staleTime: 30_000,
    initialData,
    placeholderData: initialData || DEFAULT_HOMEPAGE_CONFIG,
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
