"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/ui/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Boxes, CheckCircle2, LayoutGrid, Loader2, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import {
  COUNTRY_OPTIONS,
  deleteProductSection,
  fetchProductSections,
  saveProductSection,
  type ProductSection,
} from "@/lib/content";
import { Field, ModalShell, RowBtn, StatTile, StatusBadge, inputCls } from "@/components/admin/PromoUI";


type Form = Partial<ProductSection>;

const emptyForm: Form = {
  name: "",
  slug: "",
  layout: "grid",
  category: "",
  sort_order: 1,
  country_code: "all",
  is_active: true,
};

export default function AdminProductSectionsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ProductSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchProductSections());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load product sections");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "all" || (status === "active" ? r.is_active : !r.is_active)) &&
        (!q || r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)),
    );
  }, [rows, query, status]);

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

  async function toggle(row: ProductSection) {
    try {
      await saveProductSection({ ...row, is_active: !row.is_active });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(row: ProductSection) {
    if (!window.confirm(`Delete section "${row.name}"?`)) return;
    try {
      await deleteProductSection(row.id);
      toast.success("Product section deleted");
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
      await saveProductSection(form);
      toast.success(form.id ? "Section updated" : "Section added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        <nav className="text-sm">
          <Link to="/admin/dashboard" className="font-semibold text-foreground">
            Dashboard
          </Link>
          <span className="px-1.5 text-muted-foreground">/</span>
          <span className="text-muted-foreground">Product Sections</span>
        </nav>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Total sections"
            value={rows.length}
            tone="bg-sale/10 text-sale"
            icon={<Boxes className="h-5 w-5" />}
          />
          <StatTile
            label="Active"
            value={rows.filter((r) => r.is_active).length}
            tone="bg-emerald-500/10 text-emerald-600"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatTile
            label="Grid layouts"
            value={rows.filter((r) => r.layout === "grid").length}
            tone="bg-sky-500/10 text-sky-600"
            icon={<LayoutGrid className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="font-display text-lg font-bold sm:text-xl">Product Sections</h1>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search section…"
                  className={`${inputCls} pl-9 sm:w-56`}
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${inputCls} sm:w-36`}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => setForm({ ...emptyForm, sort_order: rows.length + 1 })}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add Product Section
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No sections found.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Layout</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">
                          <p className="font-medium">{r.name || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">/{r.slug}</p>
                        </td>
                        <td className="p-3 capitalize">{r.layout}</td>
                        <td className="p-3 text-muted-foreground">{r.category || "All"}</td>
                        <td className="p-3 uppercase text-muted-foreground">{r.country_code}</td>
                        <td className="p-3">
                          <StatusBadge active={r.is_active} />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <RowBtn label="Toggle status" onClick={() => toggle(r)}>
                              <Power className="h-4 w-4" />
                            </RowBtn>
                            <RowBtn label="Edit" tone="green" onClick={() => setForm(r)}>
                              <Pencil className="h-4 w-4" />
                            </RowBtn>
                            <RowBtn label="Delete" danger onClick={() => remove(r)}>
                              <Trash2 className="h-4 w-4" />
                            </RowBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border lg:hidden">
                {filtered.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.name || "Untitled"}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          /{r.slug} · {r.layout} · #{r.sort_order} · {r.country_code.toUpperCase()}
                        </p>
                      </div>
                      <StatusBadge active={r.is_active} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => toggle(r)}
                        className="h-9 flex-1 rounded-lg border border-border text-xs font-semibold"
                      >
                        {r.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setForm(r)}
                        className="h-9 flex-1 rounded-lg border border-border text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(r)}
                        className="h-9 flex-1 rounded-lg border border-destructive/40 text-xs font-semibold text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!loading && filtered.length > 0 && (
            <p className="border-t border-border p-4 text-xs text-muted-foreground sm:text-sm">
              Showing 1 to {filtered.length} of {filtered.length} entries
            </p>
          )}
        </div>
      </div>

      {form && (
        <ModalShell
          title={form.id ? "Edit product section" : "Add product section"}
          onClose={() => setForm(null)}
          onSubmit={submit}
          saving={saving}
          submitLabel="Save section"
        >
          <Field label="Name">
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Slug (auto if empty)">
            <input
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Layout">
            <select
              value={form.layout ?? "grid"}
              onChange={(e) => setForm({ ...form, layout: e.target.value })}
              className={inputCls}
            >
              <option value="grid">Grid</option>
              <option value="slider">Slider</option>
              <option value="banner">Banner</option>
            </select>
          </Field>
          <Field label="Category filter">
            <select
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputCls}
            >
              <option value="">All categories</option>
              <option value="MEN">MEN</option>
              <option value="WOMEN">WOMEN</option>
              <option value="JUNIORS">JUNIORS</option>
            </select>
          </Field>
          <Field label="Sort order">
            <input
              type="number"
              min="0"
              value={form.sort_order ?? 0}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Country">
            <select
              value={form.country_code ?? "all"}
              onChange={(e) => setForm({ ...form, country_code: e.target.value })}
              className={inputCls}
            >
              <option value="all">All countries</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 accent-[var(--sale)]"
            />
            Active
          </label>
        </ModalShell>
      )}
    </AdminShell>
  );
}
