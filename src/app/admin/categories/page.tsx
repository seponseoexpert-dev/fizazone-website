"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Copy,
  Layers,
  Loader2,
  MinusCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

import {
  COUNTRY_TABS,
  emptyCategoryTranslation,
  fetchCategories,
  fetchCategoryTranslations,
  saveCategoryTranslation,
  type CategoryRow,
  type CategoryTranslation,
} from "@/lib/translations";


const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type TransMap = Record<string, CategoryTranslation>;

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [translations, setTranslations] = useState<CategoryTranslation[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CategoryRow | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, trans, prods] = await Promise.all([
        fetchCategories(),
        fetchCategoryTranslations(),
        supabase.from("products").select("category"),
      ]);
      const c: Record<string, number> = {};
      for (const p of (prods.data ?? []) as { category: string }[]) {
        const k = slugify(p.category ?? "");
        if (k) c[k] = (c[k] ?? 0) + 1;
      }
      setRows(cats);
      setTranslations(trans);
      setCounts(c);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load categories");
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

  const nameOf = useCallback(
    (id: string) =>
      translations.find((t) => t.category_id === id && t.country_code === "bd")?.name ?? "",
    [translations],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.base_slug.toLowerCase().includes(q) || nameOf(r.id).toLowerCase().includes(q),
    );
  }, [rows, query, nameOf]);

  const liveMarkets = (id: string) =>
    COUNTRY_TABS.filter((c) =>
      translations.some(
        (t) => t.category_id === id && t.country_code === c.code && t.is_visible && t.name,
      ),
    ).map((c) => c.label);

  async function remove(row: CategoryRow) {
    if (!confirm(`Delete category "${row.base_slug}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Category deleted");
    void load();
  }

  if (allowed === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Admins only</h1>
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

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Categories
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Live catalogue categories with per-country name, SEO, banner and visibility
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add category
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Categories", value: rows.length },
            {
              label: "Live in BD",
              value: rows.filter((r) => liveMarkets(r.id).includes("BD")).length,
            },
            {
              label: "Translations",
              value: translations.length,
            },
            {
              label: "Products mapped",
              value: Object.values(counts).reduce((a, b) => a + b, 0),
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-xl font-extrabold sm:text-2xl">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-sale"
          />
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-xl border border-border bg-card p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            <Layers className="mx-auto mb-3 h-6 w-6" />
            No categories yet. Add your first category.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Base slug</th>
                    <th className="p-3">Products</th>
                    <th className="p-3">Live markets</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3 font-semibold">{nameOf(r.id) || r.base_slug}</td>
                      <td className="p-3 text-muted-foreground">{r.base_slug}</td>
                      <td className="p-3">{counts[r.base_slug] ?? 0}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {liveMarkets(r.id).length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            liveMarkets(r.id).map((m) => (
                              <span
                                key={m}
                                className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold"
                              >
                                {m}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditing(r)}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => remove(r)}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{nameOf(r.id) || r.base_slug}</p>
                      <p className="text-xs text-muted-foreground">/{r.base_slug}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold">
                      {counts[r.base_slug] ?? 0} products
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {liveMarkets(r.id).map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setEditing(r)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-md border border-border text-xs font-semibold"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {editing && (
        <CategoryModal
          row={editing === "new" ? null : editing}
          existing={
            editing === "new"
              ? []
              : translations.filter((t) => t.category_id === (editing as CategoryRow).id)
          }
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </AdminShell>
  );
}

function CategoryModal({
  row,
  existing,
  onClose,
  onSaved,
}: {
  row: CategoryRow | null;
  existing: CategoryTranslation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [baseSlug, setBaseSlug] = useState(row?.base_slug ?? "");
  const [tab, setTab] = useState<string>("bd");
  const [saving, setSaving] = useState(false);
  const [map, setMap] = useState<TransMap>(() => {
    const next: TransMap = {};
    for (const c of COUNTRY_TABS) {
      next[c.code] =
        existing.find((t) => t.country_code === c.code) ??
        emptyCategoryTranslation(row?.id ?? "", c.code);
    }
    return next;
  });

  const current = map[tab]!;
  const patch = (next: Partial<CategoryTranslation>) =>
    setMap((m) => ({ ...m, [tab]: { ...m[tab]!, ...next } }));

  function copyFromBd() {
    const bd = map["bd"]!;
    patch({
      name: bd.name,
      short_description: bd.short_description,
      long_description: bd.long_description,
      faqs: bd.faqs.map((f) => ({ ...f })),
      seo_title: bd.seo_title,
      seo_meta_description: bd.seo_meta_description,
      banner_image: bd.banner_image,
      slug: bd.slug,
      is_visible: bd.is_visible,
    });
    toast.success("Copied from BD");
  }

  const faqs = current.faqs ?? [];
  const setFaqs = (next: typeof faqs) => patch({ faqs: next });

  async function save() {
    const slug = slugify(baseSlug || map["bd"]!.name);
    if (!slug) {
      toast.error("Base slug or BD name is required");
      return;
    }
    setSaving(true);
    try {
      let id = row?.id;
      if (!id) {
        const { data, error } = await supabase
          .from("categories")
          .insert({ base_slug: slug })
          .select("id")
          .single();
        if (error) throw error;
        id = data.id as string;
      } else if (slug !== row?.base_slug) {
        const { error } = await supabase
          .from("categories")
          .update({ base_slug: slug })
          .eq("id", id);
        if (error) throw error;
      }

      for (const c of COUNTRY_TABS) {
        const t = map[c.code]!;
        if (
          !t.name.trim() &&
          !t.slug.trim() &&
          !t.banner_image.trim() &&
          !t.short_description.trim() &&
          !t.long_description.trim() &&
          (t.faqs ?? []).length === 0
        )
          continue;
        await saveCategoryTranslation({
          ...t,
          category_id: id,
          slug: slugify(t.slug || t.name || slug),
        });
      }
      toast.success(row ? "Category updated" : "Category created");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-base font-extrabold sm:text-lg">
            {row ? "Edit category" : "Add category"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Base slug (shared)
            </label>
            <input
              value={baseSlug}
              onChange={(e) => setBaseSlug(e.target.value)}
              placeholder="men"
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {COUNTRY_TABS.map((c) => (
              <button
                key={c.code}
                onClick={() => setTab(c.code)}
                className={`h-9 shrink-0 rounded-lg px-4 text-sm font-semibold ${
                  tab === c.code
                    ? "bg-sale text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
            {tab !== "bd" && (
              <button
                onClick={copyFromBd}
                className="ml-auto inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold"
              >
                <Copy className="h-3.5 w-3.5" /> Copy from BD
              </button>
            )}
          </div>

          <Field
            label="Category name"
            value={current.name}
            onChange={(v) => patch({ name: v })}
            placeholder="Men"
          />

          <div>
            <label className="text-sm font-medium">Short Description</label>
            <textarea
              value={current.short_description}
              onChange={(e) => patch({ short_description: e.target.value })}
              rows={3}
              placeholder="One or two lines shown at the top of the category page…"
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-sale"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Long Description</label>
            <div className="mt-1">
              <RichTextEditor
                value={current.long_description}
                onChange={(html) => patch({ long_description: html })}
                placeholder="Write the SEO landing content for this category…"
                minHeight={220}
              />
            </div>
          </div>

          {/* FAQ builder */}
          <div className="rounded-xl border border-border p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-extrabold sm:text-base">FAQ</h3>
              <button
                type="button"
                onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add FAQ
              </button>
            </div>

            {faqs.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                No FAQ yet. Added questions are also published as FAQ structured data.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {faqs.map((f, i) => (
                  <div key={i} className="relative rounded-xl border border-border bg-background p-3">
                    <button
                      type="button"
                      aria-label="Remove FAQ"
                      onClick={() => setFaqs(faqs.filter((_, n) => n !== i))}
                      className="absolute right-2 top-2 text-destructive"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                    <input
                      value={f.question}
                      onChange={(e) =>
                        setFaqs(
                          faqs.map((x, n) => (n === i ? { ...x, question: e.target.value } : x)),
                        )
                      }
                      placeholder={`Q${i + 1}: Question`}
                      className="h-10 w-full rounded-lg border border-border bg-card pl-3 pr-8 text-sm outline-none focus:border-sale"
                    />
                    <textarea
                      value={f.answer}
                      onChange={(e) =>
                        setFaqs(faqs.map((x, n) => (n === i ? { ...x, answer: e.target.value } : x)))
                      }
                      rows={3}
                      placeholder="A: Answer"
                      className="mt-2 w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-sale"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <CountedField
            label="SEO Title"
            value={current.seo_title}
            onChange={(v) => patch({ seo_title: v })}
            max={60}
          />
          <CountedField
            label="Permalink"
            value={current.slug}
            onChange={(v) => patch({ slug: v })}
            max={75}
            placeholder="men"
          />
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Meta Description</label>
              <span
                className={`text-xs ${
                  current.seo_meta_description.length > 160
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {current.seo_meta_description.length} / 160
              </span>
            </div>
            <textarea
              value={current.seo_meta_description}
              onChange={(e) => patch({ seo_meta_description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-sale"
            />
          </div>

          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            URL preview:{" "}
            <span className="font-semibold text-foreground">
              /{tab}/categories?category={slugify(current.slug || current.name || baseSlug) || "…"}
            </span>
          </p>

          <ImageUploader
            label="Image"
            folder="categories"
            value={current.banner_image}
            onChange={(url) => patch({ banner_image: url })}
          />



          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={current.is_visible}
              onChange={(e) => patch({ is_visible: e.target.checked })}
              className="h-4 w-4 accent-[oklch(0.58_0.22_25)]"
            />
            Visible in {tab.toUpperCase()}
          </label>
        </div>

        <div className="flex gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
      />
    </div>
  );
}

function CountedField({
  label,
  value,
  onChange,
  max,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className={`text-xs ${value.length > max ? "text-destructive" : "text-muted-foreground"}`}>
          {value.length} / {max}
        </span>
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
      />
    </div>
  );
}
