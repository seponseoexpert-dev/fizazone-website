import { supabase } from "@/integrations/supabase/client";

export type Banner = {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  sort_order: number;
  country_code: string;
  is_active: boolean;
};

export type AdminUser = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  role: AdminRole;
  country_code: string | null;
  is_active: boolean;
};

export type AdminRole = "super_admin" | "editor" | "country_manager";

export const ADMIN_ROLES: { value: AdminRole; label: string; hint: string }[] = [
  { value: "super_admin", label: "Super Admin", hint: "Full access to every page and market" },
  { value: "editor", label: "Editor", hint: "Can manage content, products and orders" },
  {
    value: "country_manager",
    label: "Country Manager",
    hint: "Sees and edits data for one assigned country only",
  },
];

export const COUNTRY_OPTIONS = [
  { value: "bd", label: "Bangladesh (BD)" },
  { value: "uk", label: "United Kingdom (UK)" },
  { value: "us", label: "United States (US)" },
  { value: "ca", label: "Canada (CA)" },
];

export const roleLabel = (role: string) =>
  ADMIN_ROLES.find((r) => r.value === role)?.label ?? role;

/* ---------------- Banners ---------------- */

export async function fetchBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Banner[];
}

export async function saveBanner(row: Partial<Banner>) {
  const payload = {
    image_url: row.image_url ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    button_text: row.button_text ?? "",
    button_link: row.button_link ?? "/categories",
    sort_order: Number(row.sort_order ?? 0),
    country_code: (row.country_code ?? "all").toLowerCase(),
    is_active: row.is_active ?? true,
  };
  if (row.id) {
    const { error } = await supabase.from("banners").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("banners").insert(payload);
    if (error) throw error;
  }
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Admin users ---------------- */

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("admin_roles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function saveAdminUser(row: Partial<AdminUser>) {
  const role = (row.role ?? "editor") as AdminRole;
  const payload = {
    email: (row.email ?? "").toLowerCase().trim(),
    full_name: row.full_name ?? "",
    role,
    country_code: role === "country_manager" ? (row.country_code ?? "bd") : null,
    is_active: row.is_active ?? true,
  };
  if (row.id) {
    const { error } = await supabase.from("admin_roles").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("admin_roles").insert(payload);
    if (error) throw error;
  }
}

export async function deleteAdminUser(id: string) {
  const { error } = await supabase.from("admin_roles").delete().eq("id", id);
  if (error) throw error;
}

/** Role record of the signed-in staff member, used to scope country data. */
export async function fetchMyAdminRole(userId: string, email?: string | null) {
  const { data } = await supabase
    .from("admin_roles")
    .select("*")
    .or(`user_id.eq.${userId}${email ? `,email.eq.${email.toLowerCase()}` : ""}`)
    .maybeSingle();
  return (data ?? null) as AdminUser | null;
}

/* ---------------- Promo: coupons / promotions / product sections ---------------- */

export type Coupon = {
  id: string;
  name: string;
  code: string;
  discount: number;
  discount_type: "fixed" | "percentage";
  min_order: number;
  usage_limit: number;
  start_date: string;
  end_date: string;
  country_code: string;
  is_active: boolean;
};

export type Promotion = {
  id: string;
  name: string;
  type: "big" | "small";
  image_url: string;
  link: string;
  sort_order: number;
  country_code: string;
  is_active: boolean;
};

export type ProductSection = {
  id: string;
  name: string;
  slug: string;
  layout: string;
  category: string;
  sort_order: number;
  country_code: string;
  is_active: boolean;
};

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Coupon[];
}

export async function saveCoupon(row: Partial<Coupon>) {
  const payload = {
    name: row.name ?? "",
    code: (row.code ?? "").trim().toLowerCase(),
    discount: Number(row.discount ?? 0),
    discount_type: row.discount_type ?? "fixed",
    min_order: Number(row.min_order ?? 0),
    usage_limit: Number(row.usage_limit ?? 0),
    start_date: row.start_date ?? new Date().toISOString(),
    end_date: row.end_date ?? new Date(Date.now() + 31536000000).toISOString(),
    country_code: (row.country_code ?? "all").toLowerCase(),
    is_active: row.is_active ?? true,
  };
  if (row.id) {
    const { error } = await supabase.from("coupons").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("coupons").insert(payload);
    if (error) throw error;
  }
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Promotion[];
}

export async function savePromotion(row: Partial<Promotion>) {
  const payload = {
    name: row.name ?? "",
    type: row.type ?? "small",
    image_url: row.image_url ?? "",
    link: row.link ?? "/categories",
    sort_order: Number(row.sort_order ?? 0),
    country_code: (row.country_code ?? "all").toLowerCase(),
    is_active: row.is_active ?? true,
  };
  if (row.id) {
    const { error } = await supabase.from("promotions").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("promotions").insert(payload);
    if (error) throw error;
  }
}

export async function deletePromotion(id: string) {
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchProductSections(): Promise<ProductSection[]> {
  const { data, error } = await supabase
    .from("product_sections")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductSection[];
}

export async function saveProductSection(row: Partial<ProductSection>) {
  const slug =
    (row.slug ?? "").trim() ||
    (row.name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const payload = {
    name: row.name ?? "",
    slug,
    layout: row.layout ?? "grid",
    category: row.category ?? "",
    sort_order: Number(row.sort_order ?? 0),
    country_code: (row.country_code ?? "all").toLowerCase(),
    is_active: row.is_active ?? true,
  };
  if (row.id) {
    const { error } = await supabase.from("product_sections").update(payload).eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("product_sections").insert(payload);
    if (error) throw error;
  }
}

export async function deleteProductSection(id: string) {
  const { error } = await supabase.from("product_sections").delete().eq("id", id);
  if (error) throw error;
}
