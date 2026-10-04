"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ShippingSettings = {
  inside_dhaka: number;
  outside_dhaka: number;
  flat_rate: number;
  free_shipping_threshold: number;
  delivery_note: string;
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  inside_dhaka: 80,
  outside_dhaka: 130,
  flat_rate: 100,
  free_shipping_threshold: 3000,
  delivery_note: "Delivery within 2-5 working days across Bangladesh.",
};

export async function fetchShippingSettings(): Promise<ShippingSettings> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping")
      .maybeSingle();

    if (!error && data?.value && typeof data.value === "object") {
      const val = data.value as Record<string, unknown>;
      return {
        inside_dhaka: Number(val.inside_dhaka) || DEFAULT_SHIPPING_SETTINGS.inside_dhaka,
        outside_dhaka: Number(val.outside_dhaka) || DEFAULT_SHIPPING_SETTINGS.outside_dhaka,
        flat_rate: Number(val.flat_rate) || DEFAULT_SHIPPING_SETTINGS.flat_rate,
        free_shipping_threshold:
          Number(val.free_shipping_threshold) || DEFAULT_SHIPPING_SETTINGS.free_shipping_threshold,
        delivery_note:
          (val.delivery_note as string) || DEFAULT_SHIPPING_SETTINGS.delivery_note,
      };
    }
  } catch (err) {
    console.warn("Error fetching shipping settings:", err);
  }

  return DEFAULT_SHIPPING_SETTINGS;
}

export function useShippingSettings() {
  return useQuery({
    queryKey: ["shipping-settings"],
    queryFn: fetchShippingSettings,
    staleTime: 60 * 1000,
    placeholderData: DEFAULT_SHIPPING_SETTINGS,
  });
}
