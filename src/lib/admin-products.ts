import { supabase } from "@/integrations/supabase/client";
import { uploadSiteImages } from "@/lib/uploads";


export const CATEGORIES = ["MEN", "WOMEN", "JUNIORS"] as const;
export type AdminCategory = (typeof CATEGORIES)[number];

export type Variant = {
  id?: string;
  size: string;
  color: string;
  stock_qty: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  sale_price: number | null;
  sizes: string[];
  colors: string[];
  images: string[];
  image_alts?: string[];
  created_at: string;
  product_variants?: Variant[];
};

export const BUCKET = "product-images";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** True when another product already uses this permalink slug. */
export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  if (!slug) return false;
  let q = supabase.from("products").select("id").eq("slug", slug).limit(1);
  if (excludeId) q = q.neq("id", excludeId);
  const { data, error } = await q;
  if (error) return false;
  return (data ?? []).length > 0;
}

/**
 * Returns a conflict-free slug: keeps the requested one when free,
 * otherwise appends -2, -3, … so SEO URLs stay unique.
 */
export async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired);
  if (!base) return base;
  if (!(await slugExists(base, excludeId))) return base;

  const { data } = await supabase
    .from("products")
    .select("id, slug")
    .like("slug", `${base}%`);
  const taken = new Set(
    (data ?? []).filter((r) => r.id !== excludeId).map((r) => String(r.slug)),
  );
  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function fetchProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(id, size, color, stock_qty)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminProduct[];
}

export async function isAdmin(userId: string) {
  if (!userId) return false;
  try {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!error && Boolean(data)) return true;
  } catch {
    /* fallback to admin_roles table */
  }

  try {
    const { data: adminRow } = await supabase
      .from("admin_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (adminRow) return true;
  } catch {
    /* fallback */
  }

  return false;
}

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  sale_price: number | null;
  sizes: string[];
  colors: string[];
  images: string[];
  image_alts?: string[];
};

export async function saveProduct(
  input: ProductInput,
  variants: Variant[],
  id?: string,
): Promise<string> {
  let productId = id;

  if (productId) {
    const { error } = await supabase.from("products").update(input).eq("id", productId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("products").insert(input).select("id").single();
    if (error) throw error;
    productId = data.id as string;
  }

  // Replace the variant matrix with the submitted one.
  const keep = variants.map((v) => `${v.size}::${v.color}`);
  const { data: existing } = await supabase
    .from("product_variants")
    .select("id, size, color")
    .eq("product_id", productId);

  const stale = (existing ?? []).filter((v) => !keep.includes(`${v.size}::${v.color}`));
  if (stale.length) {
    await supabase
      .from("product_variants")
      .delete()
      .in(
        "id",
        stale.map((v) => v.id),
      );
  }

  if (variants.length) {
    const { error } = await supabase.from("product_variants").upsert(
      variants.map((v) => ({
        product_id: productId,
        size: v.size,
        color: v.color,
        stock_qty: v.stock_qty,
      })),
      { onConflict: "product_id,size,color" },
    );
    if (error) throw error;
  }

  return productId;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadImages(files: File[]): Promise<string[]> {
  return uploadSiteImages(files, "products");
}


/** The image bucket is private, so display URLs are signed on demand. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const storagePaths: string[] = [];

  for (const p of paths) {
    if (!p) continue;
    if (p.startsWith("http") || p.startsWith("/")) {
      map[p] = p;
    } else {
      storagePaths.push(p);
    }
  }

  if (storagePaths.length) {
    try {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(storagePaths, 60 * 60);
      (data ?? []).forEach((row) => {
        if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
      });
    } catch {
      /* fallback */
    }
    for (const sp of storagePaths) {
      if (!map[sp]) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(sp);
        if (data?.publicUrl) map[sp] = data.publicUrl;
      }
    }
  }

  return map;
}

export type CsvRow = {
  product: ProductInput;
  variants: Variant[];
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export const CSV_TEMPLATE =
  "name,slug,description,category,price,sale_price,sizes,colors,stock\n" +
  'Classic Tee,,Soft cotton tee,MEN,1200,990,S|M|L,Black|White,25\n' +
  'Summer Kurti,,Light printed kurti,WOMEN,1800,,M|L,Red,10\n';

/** Parses a CSV where sizes/colors are pipe-separated and `stock` applies to every combo. */
export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const idx = (key: string) => header.indexOf(key);

  return lines.slice(1).map((line, i) => {
    const cells = splitCsvLine(line);
    const get = (key: string) => {
      const at = idx(key);
      return at === -1 ? "" : (cells[at] ?? "");
    };
    const name = get("name") || `Product ${i + 1}`;
    const sizes = get("sizes").split("|").map((s) => s.trim()).filter(Boolean);
    const colors = get("colors").split("|").map((s) => s.trim()).filter(Boolean);
    const stock = Number(get("stock") || 0) || 0;
    const category = (get("category") || "MEN").toUpperCase();

    const variants: Variant[] = [];
    const sizeList = sizes.length ? sizes : [""];
    const colorList = colors.length ? colors : [""];
    for (const s of sizeList) for (const c of colorList) variants.push({ size: s, color: c, stock_qty: stock });

    return {
      product: {
        name,
        slug: get("slug") || slugify(name),
        description: get("description"),
        category: CATEGORIES.includes(category as AdminCategory) ? category : "MEN",
        price: Number(get("price") || 0) || 0,
        sale_price: get("sale_price") ? Number(get("sale_price")) : null,
        sizes,
        colors,
        images: [],
      },
      variants,
    };
  });
}