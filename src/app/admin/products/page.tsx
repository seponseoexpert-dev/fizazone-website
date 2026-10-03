"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Copy,
  Boxes,
  FileDown,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SeoSettings } from "@/components/admin/SeoSettings";

import { richTextToPlain } from "@/lib/rich-text";
import {
  CATEGORIES,
  CSV_TEMPLATE,
  type AdminProduct,
  type Variant,
  deleteProduct,
  fetchProducts,
  isAdmin,
  parseCsv,
  saveProduct,
  signedUrls,
  slugExists,
  slugify,
  uniqueSlug,
  uploadImages,
} from "@/lib/admin-products";
import { resolveImage } from "@/lib/catalog";
import { fetchProductMap, upsertProductMap } from "@/lib/localization";
import {
  COUNTRY_TABS,
  emptyProductTranslation,
  fetchProductTranslations,
  saveProductTranslation,
  type ProductTranslation,
} from "@/lib/translations";


const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free"];
const DEFAULT_COLORS = ["Black", "White", "Red", "Blue", "Green", "Beige", "Navy"];

type FormState = {
  id?: string;
  name: string;
  slug: string;
  originalSlug?: string;
  slugTouched: boolean;
  description: string;
  category: string;
  price: string;
  sale_price: string;
  sizes: string[];
  colors: string[];
  images: string[];
  imageAlts: Record<string, string>;
  stock: Record<string, number>;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  category: "MEN",
  price: "",
  sale_price: "",
  sizes: [],
  colors: [],
  images: [],
  imageAlts: {},
  stock: {},
};

const comboKey = (size: string, color: string) => `${size}::${color}`;

export default function AdminProductsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("ALL");
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const csvRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const rows = await fetchProducts();
      setProducts(rows);
      setUrls(await signedUrls(rows.flatMap((p) => p.images)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setLoading(false);
        return;
      }
      const ok = await isAdmin(data.user.id);
      setAllowed(ok);
      if (ok) void load();
      else setLoading(false);
    })();
  }, [load]);

  // Live stock updates (e.g. when a customer places an order).
  useEffect(() => {
    if (!allowed) return;
    const channel = supabase
      .channel("admin-stock")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [allowed, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "ALL" || p.category === cat) &&
        (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)),
    );
  }, [products, query, cat]);

  if (allowed === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have admin access to product management.
          </p>
          <button
            onClick={() => router.push("/" )}
            className="mt-5 h-10 rounded-lg bg-sale px-5 text-sm font-semibold text-primary-foreground"
          >
            Back to store
          </button>
        </div>
      </div>
    );
  }

  function openNew() {
    setForm({ ...emptyForm, sizes: [], colors: [], images: [], imageAlts: {}, stock: {} });
  }

  function openEdit(p: AdminProduct) {
    const stock: Record<string, number> = {};
    (p.product_variants ?? []).forEach((v) => {
      stock[comboKey(v.size, v.color)] = v.stock_qty;
    });
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      originalSlug: p.slug,
      slugTouched: true,
      description: p.description ?? "",
      category: p.category,
      price: String(p.price),
      sale_price: p.sale_price == null ? "" : String(p.sale_price),
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      images: p.images ?? [],
      imageAlts: Object.fromEntries(
        (p.images ?? []).map((img, i) => [img, (p.image_alts ?? [])[i] ?? ""]),
      ),
      stock,
    });
  }

  async function remove(p: AdminProduct) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      toast.success("Product deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const sizeList = form.sizes.length ? form.sizes : [""];
      const colorList = form.colors.length ? form.colors : [""];
      const variants: Variant[] = [];
      for (const s of sizeList)
        for (const c of colorList)
          variants.push({ size: s, color: c, stock_qty: form.stock[comboKey(s, c)] ?? 0 });

      const desiredSlug = form.slug || slugify(form.name);
      const finalSlug = await uniqueSlug(desiredSlug, form.id);
      if (finalSlug !== desiredSlug) {
        toast.info(`Slug "${desiredSlug}" was taken — saved as "${finalSlug}"`);
      }

      await saveProduct(
        {
          name: form.name,
          slug: finalSlug,
          description: form.description,
          category: form.category,
          price: Number(form.price) || 0,
          sale_price: form.sale_price ? Number(form.sale_price) : null,
          sizes: form.sizes,
          colors: form.colors,
          images: form.images,
          image_alts: form.images.map((img) => form.imageAlts[img] ?? ""),
        },
        variants,
        form.id,
      );
      toast.success(form.id ? "Product updated" : "Product added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (!rows.length) {
      toast.error("No rows found in the CSV");
      return;
    }
    let ok = 0;
    for (const row of rows) {
      try {
        await saveProduct(row.product, row.variants);
        ok++;
      } catch (err) {
        toast.error(`${row.product.name}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }
    toast.success(`Imported ${ok} of ${rows.length} products`);
    void load();
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "faiza-products-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const totalStock = products.reduce(
    (s, p) => s + (p.product_variants ?? []).reduce((a, v) => a + v.stock_qty, 0),
    0,
  );
  const outOfStock = products.filter(
    (p) => (p.product_variants ?? []).reduce((a, v) => a + v.stock_qty, 0) === 0,
  ).length;
  const onSale = products.filter((p) => p.sale_price != null).length;

  const stats = [
    { label: "Total products", value: products.length, icon: Package, tone: "text-sale bg-sale/10" },
    { label: "Units in stock", value: totalStock, icon: Boxes, tone: "text-emerald-600 bg-emerald-500/10" },
    { label: "Out of stock", value: outOfStock, icon: AlertTriangle, tone: "text-amber-600 bg-amber-500/10" },
    { label: "On sale", value: onSale, icon: Tag, tone: "text-indigo-600 bg-indigo-500/10" },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Product Management
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Add, edit and track your catalogue · stock updates live when an order is placed
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:shrink-0">
            <button
              onClick={downloadTemplate}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition hover:bg-secondary sm:text-sm"
            >
              <FileDown className="h-4 w-4 shrink-0" />{" "}
              <span className="truncate">CSV template</span>
            </button>
            <button
              onClick={() => csvRef.current?.click()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition hover:bg-secondary sm:text-sm"
            >
              <Upload className="h-4 w-4 shrink-0" />{" "}
              <span className="truncate">Bulk import</span>
            </button>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onCsv}
            />
            <button
              onClick={openNew}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-sale px-4 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-sm transition hover:opacity-90 sm:col-span-1 sm:text-sm"
            >
              <Plus className="h-4 w-4" /> Add product
            </button>
          </div>
        </header>


        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 sm:gap-3 sm:p-4"
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg sm:h-10 sm:w-10 ${s.tone}`}
              >
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-none sm:text-xl">{s.value}</p>
                <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                  {s.label}
                </p>
              </div>
            </div>

          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or slug"
                className={`${field} pl-9`}
              />
            </div>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className={`${field} sm:w-48`}
            >
              <option value="ALL">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid place-items-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <Package className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="mt-3 font-semibold">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first product or bulk import a CSV file.
              </p>
              <button
                onClick={openNew}
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-sale px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add product
              </button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="divide-y divide-border lg:hidden">
                {filtered.map((p) => {
                  const stock = (p.product_variants ?? []).reduce((s, v) => s + v.stock_qty, 0);
                  const rawImg = p.images?.[0];
                  const thumb = rawImg ? (urls[rawImg] || resolveImage(rawImg, p.id)) : undefined;
                  return (
                    <li key={p.id} className="flex gap-3 p-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {thumb && (
                          <img src={thumb} alt={p.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.category}</p>
                        <p className="mt-1 text-sm font-bold">
                          {p.sale_price != null ? (
                            <>
                              <span className="text-sale">৳{p.sale_price}</span>{" "}
                              <span className="text-xs font-normal text-muted-foreground line-through">
                                ৳{p.price}
                              </span>
                            </>
                          ) : (
                            <>৳{p.price}</>
                          )}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <StockBadge stock={stock} />
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              aria-label={`Edit ${p.name}`}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-border"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => remove(p)}
                              aria-label={`Delete ${p.name}`}
                              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const stock = (p.product_variants ?? []).reduce((s, v) => s + v.stock_qty, 0);
                      const rawImg = p.images?.[0];
                      const thumb = rawImg ? (urls[rawImg] || resolveImage(rawImg, p.id)) : undefined;
                      return (
                        <tr
                          key={p.id}
                          className="border-t border-border transition-colors hover:bg-secondary/40"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                                {thumb && (
                                  <img
                                    src={thumb}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{p.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.sale_price != null ? (
                              <span className="font-semibold text-sale">
                                ৳{p.sale_price}{" "}
                                <span className="text-xs font-normal text-muted-foreground line-through">
                                  ৳{p.price}
                                </span>
                              </span>
                            ) : (
                              <span className="font-semibold">৳{p.price}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StockBadge stock={stock} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEdit(p)}
                                aria-label={`Edit ${p.name}`}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-border transition hover:bg-secondary"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => remove(p)}
                                aria-label={`Delete ${p.name}`}
                                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-destructive transition hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {form && (
          <ProductForm
            form={form}
            setForm={setForm}
            saving={saving}
            onClose={() => setForm(null)}
            onSubmit={submit}
          />
        )}
      </div>
    </AdminShell>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock === 0
      ? "bg-destructive/10 text-destructive"
      : stock < 10
        ? "bg-amber-500/10 text-amber-600"
        : "bg-emerald-500/10 text-emerald-600";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {stock === 0 ? "Out of stock" : `${stock} in stock`}
    </span>
  );
}

function Chips({
  options,
  value,
  onChange,
  onAdd,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  onAdd: (v: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const all = Array.from(new Set([...options, ...value]));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {all.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                on ? "border-sale bg-sale text-primary-foreground" : "border-border hover:bg-secondary"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add custom…"
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
        />
        <button
          type="button"
          onClick={() => {
            if (!custom.trim()) return;
            onAdd(custom.trim());
            setCustom("");
          }}
          className="h-9 rounded-lg border border-border px-3 text-xs font-semibold"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ProductForm({
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}: {
  form: FormState;
  setForm: (f: FormState | null) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"details" | "country">("details");


  useEffect(() => {
    void signedUrls(form.images).then(setPreviews);
  }, [form.images]);

  const set = (patch: Partial<FormState>) => setForm({ ...form, ...patch });

  // Live permalink uniqueness check with an auto-suggested alternative.
  const [slugState, setSlugState] = useState<{
    status: "idle" | "checking" | "ok" | "taken";
    suggestion: string;
  }>({ status: "idle", suggestion: "" });

  const currentSlug = form.slug;
  const formId = form.id;
  const originalSlug = form.originalSlug;
  useEffect(() => {
    // Editing a product and keeping its own slug is never a duplicate.
    if (formId && currentSlug && currentSlug === originalSlug) {
      setSlugState({ status: "ok", suggestion: "" });
      return;
    }
    if (!currentSlug) {
      setSlugState({ status: "idle", suggestion: "" });
      return;
    }
    let cancelled = false;
    setSlugState((s) => ({ ...s, status: "checking" }));
    const t = setTimeout(async () => {
      const taken = await slugExists(currentSlug, formId);
      if (cancelled) return;
      if (!taken) {
        setSlugState({ status: "ok", suggestion: "" });
        return;
      }
      const suggestion = await uniqueSlug(currentSlug, formId);
      if (!cancelled) setSlugState({ status: "taken", suggestion });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [currentSlug, formId, originalSlug]);

  const sizeList = form.sizes.length ? form.sizes : [""];
  const colorList = form.colors.length ? form.colors : [""];

  async function onDropFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    try {
      const paths = await uploadImages(files);
      set({ images: [...form.images, ...paths] });
      toast.success(`${paths.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold sm:text-xl">
            {form.id ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 flex gap-2 border-b border-border">
          {(["details", "country"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${
                tab === t
                  ? "border-sale text-sale"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "details" ? "Product Details" : "Country Content"}
            </button>
          ))}
        </div>

        {tab === "country" && (
          <CountryContent
            productId={form.id}
            base={{
              name: form.name,
              slug: form.slug,
              description: form.description,
              price: Number(form.price) || 0,
              images: form.images,
            }}
          />
        )}


        <div className={`grid gap-4 sm:grid-cols-2 ${tab === "details" ? "" : "hidden"}`}>

          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) =>
                set({
                  name: e.target.value,
                  slug: form.slugTouched ? form.slug : slugify(e.target.value),
                })
              }
              className={field}
            />
          </label>
          <div className="text-sm sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 flex flex-wrap items-center justify-between gap-2 font-medium">
                <span>Slug (permalink)</span>
                {slugState.status === "checking" && (
                  <span className="text-[11px] text-muted-foreground">Checking…</span>
                )}
                {slugState.status === "ok" && (
                  <span className="text-[11px] font-semibold text-brand-green">Available</span>
                )}
                {slugState.status === "taken" && (
                  <span className="text-[11px] font-semibold text-destructive">Already used</span>
                )}
              </span>
              <input
                required
                value={form.slug}
                onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })}
                aria-invalid={slugState.status === "taken"}
                className={`${field} ${slugState.status === "taken" ? "border-destructive" : ""}`}
              />
            </label>
            <p className="mt-1.5 break-all text-[11px] text-muted-foreground">
              https://faizazone.com/product/{form.slug || "your-product"}
            </p>
            {slugState.status === "taken" && slugState.suggestion && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <span className="text-[11px] text-muted-foreground">
                  Suggested: <strong className="text-foreground">{slugState.suggestion}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => set({ slug: slugState.suggestion, slugTouched: true })}
                  className="h-7 rounded-full bg-sale px-3 text-[11px] font-semibold text-primary-foreground"
                >
                  Use this
                </button>
              </div>
            )}
          </div>
          <div className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Description</span>
            <RichTextEditor
              value={form.description}
              onChange={(html) => set({ description: html })}
              placeholder="Describe the product — use headings, bold text and bullet points…"
            />
          </div>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Category</span>
            <select
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              className={field}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1.5 block font-medium">Price</span>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
                className={field}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1.5 block font-medium">Sale price</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.sale_price}
                onChange={(e) => set({ sale_price: e.target.value })}
                className={field}
              />
            </label>
          </div>

          <div className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Sizes</span>
            <Chips
              options={DEFAULT_SIZES}
              value={form.sizes}
              onChange={(sizes) => set({ sizes })}
              onAdd={(v) => set({ sizes: Array.from(new Set([...form.sizes, v])) })}
            />
          </div>
          <div className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Colors</span>
            <Chips
              options={DEFAULT_COLORS}
              value={form.colors}
              onChange={(colors) => set({ colors })}
              onAdd={(v) => set({ colors: Array.from(new Set([...form.colors, v])) })}
            />
          </div>

          <div className="text-sm sm:col-span-2">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="block font-medium">Stock quantity</span>
                <span className="text-[11px] text-muted-foreground">
                  Total units:{" "}
                  <strong className="text-foreground">
                    {sizeList.reduce(
                      (sum, s) =>
                        sum +
                        colorList.reduce((a, c) => a + (form.stock[comboKey(s, c)] ?? 0), 0),
                      0,
                    )}
                  </strong>
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <span className="font-medium">Set all</span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  onChange={(e) => {
                    const qty = Number(e.target.value) || 0;
                    const next: Record<string, number> = { ...form.stock };
                    sizeList.forEach((s) =>
                      colorList.forEach((c) => {
                        next[comboKey(s, c)] = qty;
                      }),
                    );
                    set({ stock: next });
                  }}
                  className="h-9 w-24 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-sale"
                />
              </label>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">

              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 uppercase text-muted-foreground">
                  <tr>
                    <th className="p-2">Size</th>
                    <th className="p-2">Color</th>
                    <th className="p-2 w-32">Stock qty</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeList.map((s) =>
                    colorList.map((c) => {
                      const key = comboKey(s, c);
                      return (
                        <tr key={key} className="border-t border-border">
                          <td className="p-2">{s || "—"}</td>
                          <td className="p-2">{c || "—"}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min={0}
                              value={form.stock[key] ?? 0}
                              onChange={(e) =>
                                set({
                                  stock: { ...form.stock, [key]: Number(e.target.value) || 0 },
                                })
                              }
                              className="h-8 w-24 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-sale"
                            />
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm sm:col-span-2">
            <span className="mb-2 block font-medium">Images</span>
            <div className="flex flex-wrap gap-3">
              {form.images.map((path) => (
                <div key={path} className="w-32">
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={previews[path] ?? path}
                      alt={form.imageAlts[path] ?? ""}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => set({ images: form.images.filter((i) => i !== path) })}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90 text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    value={form.imageAlts[path] ?? ""}
                    onChange={(e) => set({ imageAlts: { ...form.imageAlts, [path]: e.target.value } })}
                    placeholder="Alt text"
                    aria-label="Image alt text"
                    className="mt-1.5 h-8 w-32 rounded-md border border-border bg-background px-2 text-[11px] outline-none focus:border-sale"
                  />
                </div>
              ))}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onDropFiles(Array.from(e.dataTransfer.files ?? []));
                }}
                className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-center text-[10px] leading-tight text-muted-foreground hover:bg-secondary"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    void onDropFiles(files);
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 flex-1 rounded-lg bg-sale text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : form.id ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}
function CountryContent({
  productId,
  base,
}: {
  productId?: string | undefined;
  base: { name: string; slug: string; description: string; price: number; images: string[] };
}) {
  const [rows, setRows] = useState<Record<string, ProductTranslation>>({});
  const [active, setActive] = useState<string>("bd");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  // Regional pricing extras that live on product_country_map.
  const [pricing, setPricing] = useState<Record<string, { sale_price: string; shipping_fee: string }>>(
    {},
  );

  useEffect(() => {
    (async () => {
      try {
        const saved = productId ? await fetchProductTranslations(productId) : [];
        const maps = productId ? await fetchProductMap(productId) : [];
        setPricing(
          Object.fromEntries(
            COUNTRY_TABS.map((c) => {
              const m = maps.find((x) => x.country_code === c.code);
              return [
                c.code,
                {
                  sale_price: m?.sale_price == null ? "" : String(m.sale_price),
                  shipping_fee: m?.shipping_fee == null ? "" : String(m.shipping_fee),
                },
              ];
            }),
          ),
        );
        const next: Record<string, ProductTranslation> = {};
        for (const c of COUNTRY_TABS) {
          const row = saved.find((s) => s.country_code === c.code);
          if (row) next[c.code] = { ...row, images: row.images ?? [] };
          else {
            const blank = emptyProductTranslation(productId ?? "", c.code);
            next[c.code] =
              c.code === "bd"
                ? {
                    ...blank,
                    title: base.name,
                    full_description: base.description,
                    seo_title: base.name,
                    seo_meta_description: richTextToPlain(base.description).slice(0, 155),
                    price: base.price,
                    slug: base.slug,
                    images: base.images,
                  }
                : blank;
          }
        }
        setRows(next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load country content");
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const current = rows[active];

  useEffect(() => {
    void signedUrls(current?.images ?? []).then((m) => setPreviews((p) => ({ ...p, ...m })));
  }, [current?.images]);

  const patch = (p: Partial<ProductTranslation>) =>
    setRows((r) => {
      const cur = r[active] ?? emptyProductTranslation(productId ?? "", active);
      return { ...r, [active]: { ...cur, ...p } };
    });

  function copyFromBd() {
    const bd = rows["bd"];
    if (!bd) return;
    patch({
      title: bd.title,
      full_description: bd.full_description,
      seo_title: bd.seo_title,
      seo_meta_description: bd.seo_meta_description,
      price: bd.price,
      stock: bd.stock,
      is_visible: bd.is_visible,
      images: [...bd.images],
    });
    toast.success(`Copied BD content to ${active.toUpperCase()}`);
  }

  async function onDropFiles(files: File[]) {
    if (!files.length || !current) return;
    setUploading(true);
    try {
      const paths = await uploadImages(files);
      patch({ images: [...current.images, ...paths] });
      toast.success(`${paths.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!productId || !current) return;
    const money = pricing;
    setBusy(true);
    try {
      // The canonical slug always comes from Product Details.
      await saveProductTranslation({ ...current, product_id: productId, slug: base.slug });
      await upsertProductMap([
        {
          product_id: productId,
          country_code: current.country_code,
          price: Number(current.price) || 0,
          sale_price: money[active]?.sale_price ? Number(money[active]?.sale_price) : null,
          shipping_fee: Number(money[active]?.shipping_fee || 0) || 0,
          currency: current.currency,
          stock_qty: Number(current.stock) || 0,
          is_visible: current.is_visible,
        },
      ]);
      toast.success(`${active.toUpperCase()} content saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="grid place-items-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!productId && (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Save the product first, then re-open it to edit per-country content.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-secondary/40 p-1">
          {COUNTRY_TABS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setActive(c.code)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                active === c.code
                  ? "bg-sale text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {active !== "bd" && (
          <button
            type="button"
            onClick={copyFromBd}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-sale px-3 text-xs font-semibold text-sale transition hover:bg-sale/10"
          >
            <Copy className="h-3.5 w-3.5" /> Copy from BD
          </button>
        )}
      </div>

      {current && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Product title ({active.toUpperCase()})</span>
            <input
              value={current.title}
              onChange={(e) => patch({ title: e.target.value })}
              className={field}
            />
          </label>
          <div className="text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Long Description</span>
            <RichTextEditor
              value={current.full_description}
              onChange={(html) => patch({ full_description: html })}
              placeholder="Country-specific product description…"
            />
          </div>
          <div className="sm:col-span-2">
            <SeoSettings
              title={current.seo_title}
              slug={base.slug}
              description={current.seo_meta_description}
              markets={COUNTRY_TABS.map((c) => c.code)}
              onTitle={(v) => patch({ seo_title: v })}
              onDescription={(v) => patch({ seo_meta_description: v })}
            />
          </div>

          <div className="rounded-xl border border-border p-4 sm:col-span-2">
            <h4 className="mb-3 border-b border-border pb-2 text-sm font-bold uppercase tracking-wide">
              Pricing &amp; availability ({active.toUpperCase()})
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={current.price}
                  onChange={(e) => patch({ price: Number(e.target.value) || 0 })}
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Currency</span>
                <input
                  value={current.currency}
                  onChange={(e) => patch({ currency: e.target.value.toUpperCase() })}
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Stock</span>
                <input
                  type="number"
                  min={0}
                  value={current.stock}
                  onChange={(e) => patch({ stock: Number(e.target.value) || 0 })}
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Discount / sale price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="No discount"
                  value={pricing[active]?.sale_price ?? ""}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      [active]: {
                        sale_price: e.target.value,
                        shipping_fee: p[active]?.shipping_fee ?? "",
                      },
                    }))
                  }
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Shipping cost</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={pricing[active]?.shipping_fee ?? ""}
                  onChange={(e) =>
                    setPricing((p) => ({
                      ...p,
                      [active]: {
                        sale_price: p[active]?.sale_price ?? "",
                        shipping_fee: e.target.value,
                      },
                    }))
                  }
                  className={field}
                />
              </label>
            </div>
          </div>



          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              checked={current.is_visible}
              onChange={(e) => patch({ is_visible: e.target.checked })}
              className="h-4 w-4 accent-[oklch(0.58_0.22_25)]"
            />
            Visible in {active.toUpperCase()}
          </label>

          <div className="text-sm sm:col-span-2">
            <span className="mb-2 block font-medium">Images ({active.toUpperCase()})</span>
            <div className="flex flex-wrap gap-3">
              {current.images.map((path) => (
                <div key={path} className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted">
                  <img src={previews[path] ?? path} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => patch({ images: current.images.filter((i) => i !== path) })}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90 text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onDropFiles(Array.from(e.dataTransfer.files ?? []));
                }}
                className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-center text-[10px] leading-tight text-muted-foreground hover:bg-secondary"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    void onDropFiles(files);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!productId || busy}
        className="h-10 w-full rounded-lg border border-sale text-sm font-semibold text-sale disabled:opacity-50"
      >
        {busy ? "Saving…" : `Save ${active.toUpperCase()} content`}
      </button>
    </div>
  );
}

