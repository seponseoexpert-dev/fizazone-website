"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/ui/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { BadgePercent, CalendarClock, CheckCircle2, Loader2, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import {
  COUNTRY_OPTIONS,
  deleteCoupon,
  fetchCoupons,
  saveCoupon,
  type Coupon,
} from "@/lib/content";
import { Field, ModalShell, RowBtn, StatTile, StatusBadge, inputCls } from "@/components/admin/PromoUI";


type Form = Partial<Coupon>;

const toInput = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const emptyForm: Form = {
  name: "",
  code: "",
  discount: 0,
  discount_type: "fixed",
  min_order: 0,
  usage_limit: 0,
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 31536000000).toISOString(),
  country_code: "all",
  is_active: true,
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchCoupons());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load coupons");
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
        (!q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)),
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

  async function toggle(row: Coupon) {
    try {
      await saveCoupon({ ...row, is_active: !row.is_active });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(row: Coupon) {
    if (!window.confirm(`Delete coupon "${row.name || row.code}"?`)) return;
    try {
      await deleteCoupon(row.id);
      toast.success("Coupon deleted");
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
      await saveCoupon(form);
      toast.success(form.id ? "Coupon updated" : "Coupon added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = rows.filter((r) => r.is_active).length;
  const expired = rows.filter((r) => new Date(r.end_date).getTime() < Date.now()).length;

  return (
    <AdminShell>
      <div className="space-y-5">
        <nav className="text-sm">
          <Link to="/admin/dashboard" className="font-semibold text-foreground">
            Dashboard
          </Link>
          <span className="px-1.5 text-muted-foreground">/</span>
          <span className="text-muted-foreground">Coupons</span>
        </nav>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Total coupons"
            value={rows.length}
            tone="bg-sale/10 text-sale"
            icon={<BadgePercent className="h-5 w-5" />}
          />
          <StatTile
            label="Active"
            value={activeCount}
            tone="bg-emerald-500/10 text-emerald-600"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatTile
            label="Expired"
            value={expired}
            tone="bg-amber-500/10 text-amber-600"
            icon={<CalendarClock className="h-5 w-5" />}
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="font-display text-lg font-bold sm:text-xl">Coupons</h1>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or code…"
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
                onClick={() => setForm({ ...emptyForm })}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add Coupon
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No coupons found.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Discount type</th>
                      <th className="p-3">Start date</th>
                      <th className="p-3">End date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3 font-medium">{r.name || "—"}</td>
                        <td className="p-3 text-muted-foreground">{r.code}</td>
                        <td className="p-3">{Number(r.discount).toFixed(2)}</td>
                        <td className="p-3">
                          <TypeBadge type={r.discount_type} />
                        </td>
                        <td className="p-3 text-muted-foreground">{fmt(r.start_date)}</td>
                        <td className="p-3 text-muted-foreground">{fmt(r.end_date)}</td>
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
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Code: <span className="font-medium uppercase">{r.code}</span>
                        </p>
                      </div>
                      <StatusBadge active={r.is_active} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <TypeBadge type={r.discount_type} />
                      <span className="font-semibold text-foreground">
                        {r.discount_type === "percentage"
                          ? `${Number(r.discount)}%`
                          : Number(r.discount).toFixed(2)}
                      </span>
                      <span>
                        {fmt(r.start_date)} → {fmt(r.end_date)}
                      </span>
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
          title={form.id ? "Edit coupon" : "Add coupon"}
          onClose={() => setForm(null)}
          onSubmit={submit}
          saving={saving}
          submitLabel="Save coupon"
        >
          <Field label="Name">
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Code">
            <input
              value={form.code ?? ""}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={inputCls}
              required
            />
          </Field>
          <Field label="Discount">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.discount ?? 0}
              onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Discount type">
            <select
              value={form.discount_type ?? "fixed"}
              onChange={(e) =>
                setForm({ ...form, discount_type: e.target.value as Coupon["discount_type"] })
              }
              className={inputCls}
            >
              <option value="fixed">Fixed</option>
              <option value="percentage">Percentage</option>
            </select>
          </Field>
          <Field label="Minimum order">
            <input
              type="number"
              min="0"
              value={form.min_order ?? 0}
              onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Usage limit (0 = unlimited)">
            <input
              type="number"
              min="0"
              value={form.usage_limit ?? 0}
              onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              value={toInput(form.start_date)}
              onChange={(e) =>
                setForm({ ...form, start_date: new Date(e.target.value).toISOString() })
              }
              className={inputCls}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              value={toInput(form.end_date)}
              onChange={(e) =>
                setForm({ ...form, end_date: new Date(e.target.value).toISOString() })
              }
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
          <label className="flex items-center gap-2 self-end text-sm">
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

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-1 text-[11px] font-semibold capitalize ${
        type === "percentage" ? "bg-amber-500/15 text-amber-600" : "bg-sky-500/15 text-sky-600"
      }`}
    >
      {type}
    </span>
  );
}
