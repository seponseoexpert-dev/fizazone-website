"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { fetchCountries, type Country } from "@/lib/localization";
import {
  deleteSeoMeta,
  fetchSeoMeta,
  saveSeoMeta,
  SEO_PAGE_TYPES,
  type SeoMetaInput,
  type SeoMetaRow,
} from "@/lib/seo";


const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";
const area =
  "w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition focus:border-sale";

const emptyForm: SeoMetaInput = {
  page_type: "static",
  page_key: "",
  page_label: "",
  country_code: "bd",
  meta_title: "",
  meta_description: "",
  slug: "",
  canonical_url: "",
};

export default function AdminSeoSettingsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<SeoMetaRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState<SeoMetaInput | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meta, cs] = await Promise.all([fetchSeoMeta(), fetchCountries()]);
      setRows(meta);
      setCountries(cs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load SEO data");
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
    return rows.filter((r) => {
      if (countryFilter !== "all" && r.country_code !== countryFilter) return false;
      if (typeFilter !== "all" && r.page_type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.page_label.toLowerCase().includes(q) ||
        r.page_key.toLowerCase().includes(q) ||
        r.meta_title.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q)
      );
    });
  }, [rows, query, countryFilter, typeFilter]);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveSeoMeta(form);
      toast.success(form.id ? "SEO entry updated" : "SEO entry added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: SeoMetaRow) {
    if (!window.confirm(`Delete SEO entry for ${row.page_label || row.page_key}?`)) return;
    try {
      await deleteSeoMeta(row.id);
      toast.success("Entry deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const missing = rows.filter((r) => !r.meta_title || !r.meta_description).length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              SEO Settings
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Meta title, description, slug and canonical URL per page and country
            </p>
          </div>
          <button
            onClick={() => setForm({ ...emptyForm })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add SEO entry
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Total entries" value={rows.length} tone="bg-sale/10 text-sale" />
          <StatTile
            label="Countries covered"
            value={new Set(rows.map((r) => r.country_code)).size}
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <StatTile
            label="Incomplete"
            value={missing}
            tone="bg-amber-500/10 text-amber-600"
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search page, slug or title…"
                className={`${field} pl-9`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-72">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={field}
              >
                <option value="all">All page types</option>
                {SEO_PAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className={field}
              >
                <option value="all">All countries</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No SEO entries found.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Page</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Meta title</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3">Canonical</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border align-top">
                        <td className="p-3">
                          <p className="font-semibold">{r.page_label || r.page_key}</p>
                          <p className="text-[11px] uppercase text-muted-foreground">
                            {r.page_type}
                          </p>
                        </td>
                        <td className="p-3 uppercase">{r.country_code}</td>
                        <td className="max-w-[260px] p-3">
                          <p className="truncate">{r.meta_title || "—"}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {r.meta_description || "No description"}
                          </p>
                        </td>
                        <td className="max-w-[180px] truncate p-3 text-muted-foreground">
                          {r.slug || "—"}
                        </td>
                        <td className="max-w-[220px] truncate p-3 text-muted-foreground">
                          {r.canonical_url || "—"}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <IconBtn onClick={() => setForm({ ...r })} label="Edit">
                              <Pencil className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn onClick={() => remove(r)} label="Delete" danger>
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {filtered.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {r.page_label || r.page_key}
                        </p>
                        <p className="text-[11px] uppercase text-muted-foreground">
                          {r.page_type} · {r.country_code}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <IconBtn onClick={() => setForm({ ...r })} label="Edit">
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn onClick={() => remove(r)} label="Delete" danger>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{r.meta_title || "No meta title"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.meta_description || "No meta description"}
                    </p>
                    <p className="mt-2 truncate text-[11px] text-muted-foreground">
                      {r.slug || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={submit}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 sm:max-w-2xl sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold">
                {form.id ? "Edit SEO entry" : "Add SEO entry"}
              </h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs">
                <span className="mb-1 block font-medium">Page type</span>
                <select
                  value={form.page_type}
                  onChange={(e) => setForm({ ...form, page_type: e.target.value })}
                  className={field}
                >
                  {SEO_PAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium">Country</span>
                <select
                  value={form.country_code}
                  onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  className={field}
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name} ({c.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium">Page key</span>
                <input
                  value={form.page_key ?? ""}
                  onChange={(e) => setForm({ ...form, page_key: e.target.value })}
                  placeholder="home / MEN / product id"
                  className={field}
                  required
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium">Page label</span>
                <input
                  value={form.page_label ?? ""}
                  onChange={(e) => setForm({ ...form, page_label: e.target.value })}
                  placeholder="Homepage"
                  className={field}
                />
              </label>
              <label className="text-xs sm:col-span-2">
                <span className="mb-1 block font-medium">Meta title</span>
                <input
                  value={form.meta_title ?? ""}
                  onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                  className={field}
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {(form.meta_title ?? "").length}/60 characters
                </span>
              </label>
              <label className="text-xs sm:col-span-2">
                <span className="mb-1 block font-medium">Meta description</span>
                <textarea
                  rows={3}
                  value={form.meta_description ?? ""}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  className={area}
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {(form.meta_description ?? "").length}/160 characters
                </span>
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium">URL slug</span>
                <input
                  value={form.slug ?? ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="/bd"
                  className={field}
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium">Canonical URL</span>
                <input
                  value={form.canonical_url ?? ""}
                  onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                  placeholder="https://faizazone.com/bd"
                  className={field}
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 flex-1 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save entry"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 inline-block rounded-lg px-2.5 py-1 text-lg font-extrabold ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
        danger
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-border text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
