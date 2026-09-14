import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useCountry, type CountryCode } from "@/lib/country";
import type { Banner, Promotion } from "@/lib/content";

/** App country codes -> the codes stored in the admin tables. */
export function dbCountryCode(code: CountryCode): string {
  return code === "usa" ? "us" : code;
}

const matchesCountry = (rowCountry: string, code: string) => {
  const c = (rowCountry || "all").toLowerCase();
  return c === "all" || c === code;
};

/** Active homepage banners for the visitor's market. */
export function useSiteBanners() {
  const { country } = useCountry();
  const code = dbCountryCode(country.code);

  return useQuery({
    queryKey: ["site-banners", code],
    staleTime: 60_000,
    queryFn: async (): Promise<Banner[]> => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Banner[]).filter(
        (b) => b.image_url && matchesCountry(b.country_code, code),
      );
    },
  });
}

/** Active promotions (big banner + small promo cards) for the visitor's market. */
export function useSitePromotions() {
  const { country } = useCountry();
  const code = dbCountryCode(country.code);

  return useQuery({
    queryKey: ["site-promotions", code],
    staleTime: 60_000,
    queryFn: async (): Promise<Promotion[]> => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Promotion[]).filter(
        (p) => p.image_url && matchesCountry(p.country_code, code),
      );
    },
  });
}
