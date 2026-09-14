"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Image as ImageIcon, Loader2, Pencil, Plus, Power, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { ImageUploader } from "@/components/admin/ImageUploader";

import {
  COUNTRY_OPTIONS,
  deleteBanner,
  fetchBanners,
  saveBanner,
  type Banner,
} from "@/lib/content";


const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

type Form = Partial<Banner>;

const emptyForm: Form = {
  image_url: "",
  title: "",
  subtitle: "",
  button_text: "SHOP NOW",
  button_link: "/categories",
  sort_order: 1,
  country_code: "all",
  is_active: true,
};

const countryLabel = (code: string) =>
  code === "all" ? "All countries" : (COUNTRY_OPTIONS.find((c) => c.value === code)?.label ?? code);

export default function AdminBannersPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchBanners());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load banners");
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
        (country === "all" || r.country_code === country || r.country_code === "all") &&
        (!q || r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)),
    );
  }, [rows, query, country]);

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

  async function toggle(row: Banner) {
    try {
      await saveBanner({ ...row, is_active: !row.is_active });
      toast.success(row.is_active ? "Banner hidden" : "Banner published");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(row: Banner) {
    if (!window.confirm(`Delete banner "${row.title || "Untitled"}"?`)) return;
    try {
      await deleteBanner(row.id);
      toast.success("Banner deleted");
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
      await saveBanner(form);
      toast.success(form.id ? "Banner updated" : "Banner added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Homepage Banners
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Slider images, copy, buttons and the country each banner appears in
            </p>
          </div>
          <button
            onClick={() => setForm({ ...emptyForm, sort_order: rows.length + 1 })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add banner
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="Total banners" value={rows.length} tone="text-sale bg-sale/10" />
          <StatTile
            label="Published"
            value={activeCount}
            tone="text-emerald-600 bg-emerald-500/10"
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search banner title…"
                className={`${field} pl-9`}
              />
            </div>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={`${field} sm:w-56`}
            >
              <option value="all">All countries</option>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No banners found.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Order</th>
                      <th className="p-3">Banner</th>
                      <th className="p-3">Button</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3 font-semibold text-muted-foreground">{r.sort_order}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Thumb src={r.image_url} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{r.title || "Untitled"}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {r.subtitle || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{r.button_text || "—"}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.button_link}</p>
                        </td>
                        <td className="p-3 uppercase text-muted-foreground">{r.country_code}</td>
                        <td className="p-3">
                          <StatusBadge active={r.is_active} />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <RowBtn label="Toggle status" onClick={() => toggle(r)}>
                              <Power className="h-4 w-4" />
                            </RowBtn>
                            <RowBtn label="Edit" onClick={() => setForm(r)}>
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

              {/* Mobile cards */}
              <ul className="divide-y divide-border lg:hidden">
                {filtered.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Thumb src={r.image_url} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-semibold">{r.title || "Untitled"}</p>
                          <StatusBadge active={r.is_active} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.subtitle || "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          #{r.sort_order} · {countryLabel(r.country_code)} · {r.button_text || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => toggle(r)}
                        className="h-9 flex-1 rounded-lg border border-border text-xs font-semibold"
                      >
                        {r.is_active ? "Hide" : "Publish"}
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
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={submit}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 sm:max-w-2xl sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {form.id ? "Edit banner" : "Add banner"}
              </h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploader
                label="Banner image"
                folder="banners"
                value={form.image_url ?? ""}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />

              <Field label="Title">
                <input
                  value={form.title ?? ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={field}
                />
              </Field>
              <Field label="Subtitle">
                <input
                  value={form.subtitle ?? ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className={field}
                />
              </Field>
              <Field label="Button text">
                <input
                  value={form.button_text ?? ""}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  className={field}
                />
              </Field>
              <Field label="Button link">
                <input
                  value={form.button_link ?? ""}
                  onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                  className={field}
                />
              </Field>
              <Field label="Order / sequence">
                <input
                  type="number"
                  min={0}
                  value={form.sort_order ?? 0}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className={field}
                />
              </Field>
              <Field label="Show in country">
                <select
                  value={form.country_code ?? "all"}
                  onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  className={field}
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
                Published on the storefront
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
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save banner
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card-elevated flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
        <ImageIcon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? "Published" : "Hidden"}
    </span>
  );
}

function RowBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
        danger
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
