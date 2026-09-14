"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/ui/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import {
  COUNTRY_OPTIONS,
  deletePromotion,
  fetchPromotions,
  savePromotion,
  type Promotion,
} from "@/lib/content";
import { Field, ModalShell, RowBtn, StatTile, StatusBadge, inputCls } from "@/components/admin/PromoUI";
import { ImageUploader } from "@/components/admin/ImageUploader";



type Form = Partial<Promotion>;

const emptyForm: Form = {
  name: "",
  type: "small",
  image_url: "",
  link: "/categories",
  sort_order: 1,
  country_code: "all",
  is_active: true,
};

export default function AdminPromotionsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchPromotions());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load promotions");
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
      (r) => (type === "all" || r.type === type) && (!q || r.name.toLowerCase().includes(q)),
    );
  }, [rows, query, type]);

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

  async function toggle(row: Promotion) {
    try {
      await savePromotion({ ...row, is_active: !row.is_active });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(row: Promotion) {
    if (!window.confirm(`Delete promotion "${row.name}"?`)) return;
    try {
      await deletePromotion(row.id);
      toast.success("Promotion deleted");
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
      await savePromotion(form);
      toast.success(form.id ? "Promotion updated" : "Promotion added");
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
        <nav className="text-sm">
          <Link to="/admin/dashboard" className="font-semibold text-foreground">
            Dashboard
          </Link>
          <span className="px-1.5 text-muted-foreground">/</span>
          <span className="text-muted-foreground">Promotions</span>
        </nav>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Total promotions"
            value={rows.length}
            tone="bg-sale/10 text-sale"
            icon={<Megaphone className="h-5 w-5" />}
          />
          <StatTile
            label="Active"
            value={activeCount}
            tone="bg-emerald-500/10 text-emerald-600"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatTile
            label="Big banners"
            value={rows.filter((r) => r.type === "big").length}
            tone="bg-sky-500/10 text-sky-600"
            icon={<ImageIcon className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="font-display text-lg font-bold sm:text-xl">Promotions</h1>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search promotion…"
                  className={`${inputCls} pl-9 sm:w-56`}
                />
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`${inputCls} sm:w-36`}
              >
                <option value="all">All types</option>
                <option value="big">Big</option>
                <option value="small">Small</option>
              </select>
              <button
                onClick={() => setForm({ ...emptyForm, sort_order: rows.length + 1 })}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add Promotion
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No promotions found.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Thumb src={r.image_url} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{r.name || "Untitled"}</p>
                              <p className="truncate text-xs text-muted-foreground">{r.link}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 capitalize">{r.type}</td>
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
                    <div className="flex items-start gap-3">
                      <Thumb src={r.image_url} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-semibold">{r.name || "Untitled"}</p>
                          <StatusBadge active={r.is_active} />
                        </div>
                        <p className="mt-0.5 text-[11px] capitalize text-muted-foreground">
                          {r.type} · #{r.sort_order} · {r.country_code.toUpperCase()}
                        </p>
                      </div>
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
          title={form.id ? "Edit promotion" : "Add promotion"}
          onClose={() => setForm(null)}
          onSubmit={submit}
          saving={saving}
          submitLabel="Save promotion"
        >
          <Field label="Name" full>
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Type">
            <select
              value={form.type ?? "small"}
              onChange={(e) => setForm({ ...form, type: e.target.value as Promotion["type"] })}
              className={inputCls}
            >
              <option value="big">Big</option>
              <option value="small">Small</option>
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
          <ImageUploader
            label="Promotion image"
            folder="promotions"
            value={form.image_url ?? ""}
            onChange={(url) => setForm({ ...form, image_url: url })}
          />

          <Field label="Link">
            <input
              value={form.link ?? ""}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
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
