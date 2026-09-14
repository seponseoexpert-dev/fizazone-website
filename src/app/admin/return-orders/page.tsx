"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  FileDown,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";


type ReturnOrder = {
  id: string;
  order_ref: string;
  customer_name: string;
  phone: string;
  product_name: string;
  size: string;
  color: string;
  qty: number;
  refund_amount: number;
  reason: string;
  resolution: string;
  status: string;
  admin_note: string;
  country_code: string;
  created_at: string;
};

const STATUSES = ["pending", "approved", "received", "refunded", "rejected"] as const;
const RESOLUTIONS = ["refund", "exchange", "store-credit"] as const;
const COUNTRIES = ["bd", "uk", "us", "ca"];

const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

const emptyForm = {
  order_ref: "",
  customer_name: "",
  phone: "",
  product_name: "",
  size: "",
  color: "",
  qty: 1,
  refund_amount: 0,
  reason: "",
  resolution: "refund",
  status: "pending",
  admin_note: "",
  country_code: "bd",
};

type Form = typeof emptyForm & { id?: string };

function statusTone(status: string) {
  switch (status) {
    case "approved":
      return "bg-sky-500/10 text-sky-600";
    case "received":
      return "bg-amber-500/10 text-amber-600";
    case "refunded":
      return "bg-emerald-500/10 text-emerald-600";
    case "rejected":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-secondary text-muted-foreground";
  }
}

function money(v: number) {
  return `৳${Number(v || 0).toLocaleString()}`;
}

export default function AdminReturnOrdersPage() {
  const [rows, setRows] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [country, setCountry] = useState<string>("all");
  const [detail, setDetail] = useState<ReturnOrder | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("return_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data ?? []) as ReturnOrder[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load return orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (country !== "all" && r.country_code !== country) return false;
      if (!q) return true;
      return (
        r.order_ref.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.product_name.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, country]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      refunded: rows.filter((r) => r.status === "refunded").length,
      value: rows
        .filter((r) => r.status === "refunded")
        .reduce((s, r) => s + Number(r.refund_amount || 0), 0),
    }),
    [rows],
  );

  async function updateStatus(row: ReturnOrder, next: string) {
    try {
      const { error } = await supabase
        .from("return_orders")
        .update({ status: next })
        .eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
      setDetail((d) => (d && d.id === row.id ? { ...d, status: next } : d));
      toast.success(`Marked ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function remove(row: ReturnOrder) {
    if (!window.confirm(`Delete return for ${row.product_name}?`)) return;
    try {
      const { error } = await supabase.from("return_orders").delete().eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setDetail(null);
      toast.success("Return deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const { id, ...payload } = form;
      if (id) {
        const { error } = await supabase.from("return_orders").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("return_orders").insert(payload);
        if (error) throw error;
      }
      toast.success(id ? "Return updated" : "Return added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = "order,customer,phone,product,size,color,qty,refund,resolution,status,country";
    const body = filtered
      .map((r) =>
        [
          r.order_ref,
          r.customer_name,
          r.phone,
          r.product_name,
          r.size,
          r.color,
          r.qty,
          r.refund_amount,
          r.resolution,
          r.status,
          r.country_code,
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "return-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tiles = [
    { label: "Total returns", value: String(stats.total), icon: RotateCcw, tone: "text-sale" },
    { label: "Pending", value: String(stats.pending), icon: Clock, tone: "text-amber-600" },
    { label: "Refunded", value: String(stats.refunded), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Refunded value", value: money(stats.value), icon: Banknote, tone: "text-sky-600" },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Return Orders
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Track return requests from request to refund
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium lg:flex-none"
            >
              <FileDown className="h-4 w-4" /> Export
            </button>
            <button
              onClick={() => setForm({ ...emptyForm })}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground lg:flex-none"
            >
              <Plus className="h-4 w-4" /> Add return
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t.label}
                </p>
                <t.icon className={`h-4 w-4 shrink-0 ${t.tone}`} />
              </div>
              <p className="mt-1 font-display text-lg font-extrabold sm:text-2xl">{t.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order, customer, phone or product…"
                className={`${field} pl-9`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:flex">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${field} lg:w-40`}
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`${field} lg:w-32`}
              >
                <option value="all">All markets</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
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
            <div className="p-10 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-3 h-6 w-6" />
              No return orders match your filters.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Order</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Refund</th>
                      <th className="p-3">Resolution</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="p-3 font-semibold">{r.order_ref || "—"}</td>
                        <td className="p-3">
                          <p className="font-medium">{r.customer_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.phone}</p>
                        </td>
                        <td className="p-3">
                          <p>{r.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.size || "—"} / {r.color || "—"}
                          </p>
                        </td>
                        <td className="p-3">{r.qty}</td>
                        <td className="p-3">{money(r.refund_amount)}</td>
                        <td className="p-3 capitalize">{r.resolution}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setDetail(r)}
                              className="h-8 rounded-md border border-border px-3 text-xs font-semibold"
                            >
                              View
                            </button>
                            <button
                              onClick={() => remove(r)}
                              aria-label="Delete return"
                              className="grid h-8 w-8 place-items-center rounded-md border border-destructive/40 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <ul className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
                {filtered.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.order_ref || "—"} · {r.size || "—"}/{r.color || "—"} · x{r.qty}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.customer_name || "—"} · {r.phone || "—"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-display text-base font-extrabold">
                        {money(r.refund_amount)}
                      </p>
                      <button
                        onClick={() => setDetail(r)}
                        className="h-9 rounded-lg border border-border px-4 text-xs font-semibold"
                      >
                        View details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold sm:text-lg">Return details</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {detail.order_ref || "No order ref"} ·{" "}
                  {new Date(detail.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Customer" value={detail.customer_name || "—"} />
                <Info label="Phone" value={detail.phone || "—"} />
                <Info label="Product" value={detail.product_name} />
                <Info label="Size / Colour" value={`${detail.size || "—"} / ${detail.color || "—"}`} />
                <Info label="Quantity" value={String(detail.qty)} />
                <Info label="Refund amount" value={money(detail.refund_amount)} />
                <Info label="Resolution" value={detail.resolution} />
                <Info label="Market" value={detail.country_code.toUpperCase()} />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reason</p>
                <p className="mt-1 rounded-lg bg-secondary/50 p-3 text-sm">
                  {detail.reason || "No reason provided."}
                </p>
              </div>

              {detail.admin_note && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Admin note
                  </p>
                  <p className="mt-1 rounded-lg bg-secondary/50 p-3 text-sm">{detail.admin_note}</p>
                </div>
              )}

              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Update status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => void updateStatus(detail, s)}
                      className={`h-9 rounded-lg px-3 text-xs font-semibold capitalize ${
                        detail.status === s
                          ? "bg-sale text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              <button
                onClick={() => {
                  const d = detail;
                  setDetail(null);
                  setForm({
                    id: d.id,
                    order_ref: d.order_ref,
                    customer_name: d.customer_name,
                    phone: d.phone,
                    product_name: d.product_name,
                    size: d.size,
                    color: d.color,
                    qty: d.qty,
                    refund_amount: Number(d.refund_amount),
                    reason: d.reason,
                    resolution: d.resolution,
                    status: d.status,
                    admin_note: d.admin_note,
                    country_code: d.country_code,
                  });
                }}
                className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => void remove(detail)}
                className="h-11 flex-1 rounded-lg border border-destructive/40 text-sm font-semibold text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <form
            onSubmit={submit}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:max-h-[88vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
              <h2 className="font-display text-base font-extrabold sm:text-lg">
                {form.id ? "Edit return" : "Add return"}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
              <Text
                label="Order reference"
                value={form.order_ref}
                onChange={(v) => setForm({ ...form, order_ref: v })}
                placeholder="#2105265"
              />
              <Text
                label="Customer name"
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
              />
              <Text
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Text
                label="Product name"
                value={form.product_name}
                onChange={(v) => setForm({ ...form, product_name: v })}
              />
              <Text label="Size" value={form.size} onChange={(v) => setForm({ ...form, size: v })} />
              <Text
                label="Colour"
                value={form.color}
                onChange={(v) => setForm({ ...form, color: v })}
              />
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 1 })}
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Refund amount</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.refund_amount}
                  onChange={(e) =>
                    setForm({ ...form, refund_amount: Number(e.target.value) || 0 })
                  }
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Resolution</span>
                <select
                  value={form.resolution}
                  onChange={(e) => setForm({ ...form, resolution: e.target.value })}
                  className={field}
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={field}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Market</span>
                <select
                  value={form.country_code}
                  onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  className={field}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Return reason</span>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-sale"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Admin note</span>
                <textarea
                  value={form.admin_note}
                  onChange={(e) => setForm({ ...form, admin_note: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-sale"
                />
              </label>
            </div>

            <div className="flex gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
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
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sale text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : form.id ? "Save changes" : "Add return"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words font-medium capitalize">{value}</p>
    </div>
  );
}

function Text({
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
    <label className="text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      />
    </label>
  );
}
