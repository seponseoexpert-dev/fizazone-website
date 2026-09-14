import { supabase } from "@/integrations/supabase/client";

export const COUNTRY_TABS = [
  { code: "bd", label: "BD", currency: "BDT" },
  { code: "uk", label: "UK", currency: "GBP" },
  { code: "us", label: "US", currency: "USD" },
  { code: "ca", label: "CA", currency: "CAD" },
  { code: "au", label: "AU", currency: "AUD" },
] as const;

export type CountryTabCode = (typeof COUNTRY_TABS)[number]["code"];

export type ProductTranslation = {
  id?: string;
  product_id: string;
  country_code: string;
  title: string;
  full_description: string;
  seo_title: string;
  seo_meta_description: string;
  price: number;
  currency: string;
  stock: number;
  slug: string;
  is_visible: boolean;
  images: string[];
};

export type CategoryRow = {
  id: string;
  base_slug: string;
  created_at: string;
};

export type CategoryFaq = { question: string; answer: string };

export type CategoryTranslation = {
  id?: string;
  category_id: string;
  country_code: string;
  name: string;
  short_description: string;
  long_description: string;
  faqs: CategoryFaq[];
  seo_title: string;
  seo_meta_description: string;
  banner_image: string;
  slug: string;
  is_visible: boolean;
};

export function emptyProductTranslation(
  product_id: string,
  country_code: string,
): ProductTranslation {
  const currency =
    COUNTRY_TABS.find((c) => c.code === country_code)?.currency ?? "USD";
  return {
    product_id,
    country_code,
    title: "",
    full_description: "",
    seo_title: "",
    seo_meta_description: "",
    price: 0,
    currency,
    stock: 0,
    slug: "",
    is_visible: true,
    images: [],
  };
}

export function emptyCategoryTranslation(
  category_id: string,
  country_code: string,
): CategoryTranslation {
  return {
    category_id,
    country_code,
    name: "",
    short_description: "",
    long_description: "",
    faqs: [],
    seo_title: "",
    seo_meta_description: "",
    banner_image: "",
    slug: "",
    is_visible: true,
  };
}

export async function fetchProductTranslations(
  productId: string,
): Promise<ProductTranslation[]> {
  const { data, error } = await supabase
    .from("product_translations")
    .select("*")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? []) as unknown as ProductTranslation[];
}

export async function fetchAllProductTranslations(): Promise<ProductTranslation[]> {
  const { data, error } = await supabase
    .from("product_translations")
    .select("product_id,country_code,is_visible,price,currency,stock,title")
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as unknown as ProductTranslation[];
}

export async function saveProductTranslation(row: ProductTranslation) {
  const payload = {
    product_id: row.product_id,
    country_code: row.country_code,
    title: row.title,
    full_description: row.full_description,
    seo_title: row.seo_title,
    seo_meta_description: row.seo_meta_description,
    price: Number(row.price) || 0,
    currency: row.currency,
    stock: Number(row.stock) || 0,
    slug: row.slug,
    is_visible: row.is_visible,
    images: row.images,
  };
  const { error } = await supabase
    .from("product_translations")
    .upsert(payload, { onConflict: "product_id,country_code" });
  if (error) throw error;
}

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("base_slug");
  if (error) throw error;
  return (data ?? []) as unknown as CategoryRow[];
}

export async function fetchCategoryTranslations(): Promise<CategoryTranslation[]> {
  const { data, error } = await supabase.from("category_translations").select("*");
  if (error) throw error;
  return ((data ?? []) as unknown as CategoryTranslation[]).map((t) => ({
    ...t,
    short_description: t.short_description ?? "",
    long_description: t.long_description ?? "",
    faqs: Array.isArray(t.faqs) ? t.faqs : [],
  }));
}

export async function saveCategoryTranslation(row: CategoryTranslation) {
  const payload = {
    category_id: row.category_id,
    country_code: row.country_code,
    name: row.name,
    short_description: row.short_description ?? "",
    long_description: row.long_description ?? "",
    faqs: (row.faqs ?? []).filter((f) => f.question.trim() || f.answer.trim()),
    seo_title: row.seo_title,
    seo_meta_description: row.seo_meta_description,
    banner_image: row.banner_image,
    slug: row.slug,
    is_visible: row.is_visible,
  };
  const { error } = await supabase
    .from("category_translations")
    .upsert(payload, { onConflict: "category_id,country_code" });
  if (error) throw error;
}
