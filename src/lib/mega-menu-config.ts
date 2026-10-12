"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import menImg from "@/assets/hero-style-men.jpg";
import womenImg from "@/assets/hero-style-women.jpg";
import juniorsImg from "@/assets/hero-style-juniors.jpg";
import { getImageSrc } from "@/lib/utils";

export type MegaMenuSubLink = {
  id: string;
  label: string;
  category: string;
  href?: string;
  is_active?: boolean;
};

export type MegaMenuColumn = {
  id: string;
  title: string;
  links: MegaMenuSubLink[];
};

export type MegaMenuItem = {
  id: string;
  label: string;
  category: string;
  image: string;
  is_active: boolean;
  columns: MegaMenuColumn[];
};

export const DEFAULT_MEGA_MENU_ITEMS: MegaMenuItem[] = [
  {
    id: "tab-men",
    label: "Men",
    category: "Men",
    image: getImageSrc(menImg),
    is_active: true,
    columns: [
      {
        id: "col-men-1",
        title: "Clothing",
        links: [
          { id: "link-m-1", label: "Hoodies & Sweatshirts", category: "Men" },
          { id: "link-m-2", label: "Jackets & Vests", category: "Men" },
          { id: "link-m-3", label: "Pants & Tights", category: "Pants" },
          { id: "link-m-4", label: "Panjabi", category: "Panjabi" },
          { id: "link-m-5", label: "Tops & T-Shirts", category: "T-shirt" },
        ],
      },
      {
        id: "col-men-2",
        title: "Shoes",
        links: [
          { id: "link-m-6", label: "Sneakers", category: "Men" },
          { id: "link-m-7", label: "Running", category: "Men" },
          { id: "link-m-8", label: "Sandals & Slides", category: "Men" },
          { id: "link-m-9", label: "Formal", category: "Men" },
        ],
      },
      {
        id: "col-men-3",
        title: "Accessories",
        links: [
          { id: "link-m-10", label: "Bags & Backpacks", category: "Bags" },
          { id: "link-m-11", label: "Hat & Beanies", category: "Men" },
          { id: "link-m-12", label: "Socks", category: "Men" },
          { id: "link-m-13", label: "Belts", category: "Men" },
        ],
      },
    ],
  },
  {
    id: "tab-women",
    label: "Women",
    category: "Women",
    image: getImageSrc(womenImg),
    is_active: true,
    columns: [
      {
        id: "col-w-1",
        title: "Clothing",
        links: [
          { id: "link-w-1", label: "Kurti", category: "Kurti" },
          { id: "link-w-2", label: "Tops & T-Shirts", category: "T-shirt" },
          { id: "link-w-3", label: "Pants & Leggings", category: "Pants" },
          { id: "link-w-4", label: "Dresses", category: "Women" },
          { id: "link-w-5", label: "Ethnic Wear", category: "Women" },
        ],
      },
      {
        id: "col-w-2",
        title: "Shoes",
        links: [
          { id: "link-w-6", label: "Flats", category: "Women" },
          { id: "link-w-7", label: "Heels", category: "Women" },
          { id: "link-w-8", label: "Sandals & Slides", category: "Women" },
          { id: "link-w-9", label: "Sneakers", category: "Women" },
        ],
      },
      {
        id: "col-w-3",
        title: "Accessories",
        links: [
          { id: "link-w-10", label: "Bags & Totes", category: "Bags" },
          { id: "link-w-11", label: "Scarves", category: "Women" },
          { id: "link-w-12", label: "Jewellery", category: "Women" },
          { id: "link-w-13", label: "Sunglasses", category: "Women" },
        ],
      },
    ],
  },
  {
    id: "tab-juniors",
    label: "Juniors",
    category: "Boys",
    image: getImageSrc(juniorsImg),
    is_active: true,
    columns: [
      {
        id: "col-j-1",
        title: "Clothing",
        links: [
          { id: "link-j-1", label: "Boys T-Shirts", category: "Boys" },
          { id: "link-j-2", label: "Girls Dresses", category: "Boys" },
          { id: "link-j-3", label: "Hoodies", category: "Boys" },
          { id: "link-j-4", label: "Pants & Joggers", category: "Pants" },
        ],
      },
      {
        id: "col-j-2",
        title: "Shoes",
        links: [
          { id: "link-j-5", label: "Sneakers", category: "Boys" },
          { id: "link-j-6", label: "Sandals", category: "Boys" },
          { id: "link-j-7", label: "School Shoes", category: "Boys" },
        ],
      },
      {
        id: "col-j-3",
        title: "Accessories",
        links: [
          { id: "link-j-8", label: "School Bags", category: "Bags" },
          { id: "link-j-9", label: "Caps", category: "Boys" },
          { id: "link-j-10", label: "Socks", category: "Boys" },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "fz_mega_menu_items";

export async function fetchMegaMenuConfig(): Promise<MegaMenuItem[]> {
  // 1. Direct Supabase read from site_settings table
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "mega_menu_config")
      .maybeSingle();

    if (!error && data?.value && Array.isArray(data.value) && data.value.length > 0) {
      const items = data.value as MegaMenuItem[];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {}
      }
      return items;
    }
  } catch (err) {
    console.warn("Direct Supabase fetch for mega_menu_config notice:", err);
  }

  // 2. Fetch from Next.js API route
  try {
    const res = await fetch("/api/mega-menu", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
          } catch {}
        }
        return json;
      }
    }
  } catch (err) {
    console.warn("API fetch error for mega menu:", err);
  }

  // 3. Read cached localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  return DEFAULT_MEGA_MENU_ITEMS;
}

export async function saveMegaMenuConfig(items: MegaMenuItem[]): Promise<boolean> {
  // 1. Immediate local cache write
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  // 2. Write to Supabase site_settings
  let supabaseOk = false;
  try {
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "mega_menu_config", value: items as never },
        { onConflict: "key" }
      );
    if (!error) supabaseOk = true;
    else console.warn("Supabase upsert warning for mega menu:", error.message);
  } catch (sbErr) {
    console.warn("Supabase upsert exception for mega menu:", sbErr);
  }

  // 3. Post to API route
  try {
    const res = await fetch("/api/mega-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn("API post warning for mega menu:", err);
  }

  return supabaseOk;
}

export function useMegaMenuConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["mega-menu-config"],
    queryFn: fetchMegaMenuConfig,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const mutation = useMutation({
    mutationFn: saveMegaMenuConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mega-menu-config"] });
    },
  });

  return {
    items: query.data || DEFAULT_MEGA_MENU_ITEMS,
    isLoading: query.isLoading,
    saveConfig: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
