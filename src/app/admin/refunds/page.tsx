"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock,
  FileDown,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";


type Refund = {
  id: string;
  return_id: string | null;
  order_ref: string;
  customer_name: string;
  amount: number;
  method: string;
  reference: string;
  status: string;
  note: string;
  country_code: string;
  created_at: string;
};

type ReturnLite = {
  id: string;
  order_ref: string;
  customer_name: string;
  product_name: string;
  refund_amount: number;
  country_code: string;
};

const STATUSES = ["pending", "processing", "completed", "failed"] as const;
const METHODS = ["cash", "bkash", "nagad", "card", "bank", "store-credit"] as const;
const COUNTRIES = ["bd", "uk", "us", "ca"];

const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

const emptyForm = {
  return_id: "",
  order_ref: "",
  customer_name: "",
  amount: 0,
  method: "bkash",
  reference: "",
  status: "pending",
  note: "",
  country_code: "bd",
};

type Form = typeof emptyForm & { id?: string };

function statusTone(status: string) {
  switch (status) {
    case "processing":
      return "bg-sky-500/10 text-sky-600";
    case "completed":
      return "bg-emerald-500/10 text-emerald-600";
    case "failed":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-amber-500/10 text-amber-600";
  }
}

function money(v: number) {
  return `৳${Number(v || 0).toLocaleString()}`;
}

export default function AdminRefundsPage() {
  const [rows, setRows] = useState<Refund[]>([]);
  const [returns, setReturns] = useState<ReturnLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [detail, setDetail] = useState<Refund | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [refundsRes, returnsRes] = await Promise.all([
        supabase.from("refunds").select("*").order("created_at", { ascending: false }),
        supabase
          .from("return_orders")
          .select("id, order_ref, customer_name, product_name, refund_amount, country_code")
          .order("created_at", { ascending: false }),
      ]);
      if (refundsRes.error) throw refundsRes.error;
      if (returnsRes.error) throw returnsRes.error;
      setRows((refundsRes.data ?? []) as Refund[]);
      setReturns((returnsRes.data ?? []) as ReturnLite[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load refunds");
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
      if (method !== "all" && r.method !== method) return false;
      if (!q) return true;
      return (
        r.order_ref.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, method]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending" || r.status === "processing").length,
      completed: rows.filter((r) => r.status === "completed").length,
      paid: rows
        .filter((r) => r.status === "completed")
        .reduce((s, r) => s + Number(r.amount || 0), 0),
    }),
    [rows],
  );

  async function updateStatus(row: Refund, next: string) {
    try {
      const { error } = await supabase.from("refunds").update({ status: next }).eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
      setDetail((d) => (d && d.id === row.id ? { ...d, status: next } : d));
      if (next === "completed" && row.return_id) {
        await supabase.from("return_orders").update({ status: "refunded" }).eq("id", row.return_id);
      }
      toast.success(`Refund marked ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function remove(row: Refund) {
    if (!window.confirm(`Delete refund of ${money(row.amount)}?`)) return;
    try {
      const { error } = await supabase.from("refunds").delete().eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setDetail(null);
      toast.success("Refund deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const { id, return_id, ...rest } = form;
      const payload = { ...rest, return_id: return_id || null };
      if (id) {
        const { error } = await supabase.from("refunds").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("refunds").insert(payload);
        if (error) throw error;
      }
      if (payload.status === "completed" && payload.return_id) {
        await supabase
          .from("return_orders")
          .update({ status: "refunded" })
          .eq("id", payload.return_id);
      }
      toast.success(id ? "Refund updated" : "Refund recorded");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function pickReturn(returnId: string) {
    if (!form) return;
    const r = returns.find((x) => x.id === returnId);
    if (!r) {
      setForm({ ...form, return_id: "" });
      return;
    }
    setForm({
      ...form,
      return_id: r.id,
      order_ref: r.order_ref,
      customer_name: r.customer_name,
      amount: Number(r.refund_amount) || 0,
      country_code: r.country_code,
    });
  }

  function exportCsv() {
    const header = "order,customer,amount,method,reference,status,country,created";
    const body = filtered
      .map((r) =>
        [
          r.order_ref,
          r.customer_name,
          r.amount,
          r.method,
          r.reference,
          r.status,
          r.country_code,
          new Date(r.created_at).toLocaleString(),
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "refunds.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tiles = [
    { label: "Refund records", value: String(stats.total), icon: RotateCcw, tone: "text-sale" },
    { label: "Awaiting payout", value: String(stats.pending), icon: Clock, tone: "text-amber-600" },
    {
      label: "Completed",
      value: String(stats.completed),
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    { label: "Total paid", value: money(stats.paid), icon: Banknote, tone: "text-sky-600" },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Return And Refunds
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Money paid back to customers against approved returns
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
              <Plus className="h-4 w-4" /> New refund
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
                placeholder="Search order, customer or transaction ref…"
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
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={`${field} lg:w-40`}
              >
                <option value="all">All methods</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
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
              <Wallet className="mx-auto mb-3 h-6 w-6" />
              No refunds match your filters.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Order</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="p-3 font-semibold">{r.order_ref || "—"}</td>
                        <td className="p-3">{r.customer_name || "—"}</td>
                        <td className="p-3 font-semibold">{money(r.amount)}</td>
                        <td className="p-3 capitalize">{r.method}</td>
                        <td className="p-3 text-muted-foreground">{r.reference || "—"}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
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
                              aria-label="Delete refund"
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
                        <p className="truncate font-semibold">{r.customer_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.order_ref || "—"} · {r.method}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusTone(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-display text-base font-extrabold">{money(r.amount)}</p>
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
                <h2 className="font-display text-base font-extrabold sm:text-lg">Refund details</h2>
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
                <Info label="Amount" value={money(detail.amount)} />
                <Info label="Method" value={detail.method} />
                <Info label="Transaction ref" value={detail.reference || "—"} />
                <Info label="Market" value={detail.country_code.toUpperCase()} />
                <Info label="Linked return" value={detail.return_id ? "Yes" : "Manual"} />
              </div>

              {detail.note && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Note</p>
                  <p className="mt-1 rounded-lg bg-secondary/50 p-3 text-sm">{detail.note}</p>
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
                    return_id: d.return_id ?? "",
                    order_ref: d.order_ref,
                    customer_name: d.customer_name,
                    amount: Number(d.amount),
                    method: d.method,
                    reference: d.reference,
                    status: d.status,
                    note: d.note,
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
                {form.id ? "Edit refund" : "New refund"}
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
              <label className="text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium">Linked return request</span>
                <select
                  value={form.return_id}
                  onChange={(e) => pickReturn(e.target.value)}
                  className={field}
                >
                  <option value="">Manual refund (no return)</option>
                  {returns.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.order_ref || "no-ref"} · {r.product_name} · {r.customer_name}
                    </option>
                  ))}
                </select>
              </label>
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
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Refund amount</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                  className={field}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">Refund method</span>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className={field}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <Text
                label="Transaction reference"
                value={form.reference}
                onChange={(v) => setForm({ ...form, reference: v })}
                placeholder="bKash TrxID"
              />
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
                <span className="mb-1.5 block font-medium">Note</span>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
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
                {saving ? "Saving…" : form.id ? "Save changes" : "Record refund"}
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
