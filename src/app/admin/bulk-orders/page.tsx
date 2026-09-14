"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Package, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";


type BulkRow = {
  id: string;
  product_name: string;
  product_link: string;
  customer_name: string;
  phone: string;
  email: string;
  company: string;
  qty: number;
  size: string;
  color: string;
  notes: string;
  status: string;
  admin_note: string;
  country_code: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;

const statusClass = (s: string) =>
  s === "won"
    ? "bg-emerald-100 text-emerald-700"
    : s === "lost"
      ? "bg-rose-100 text-rose-700"
      : s === "quoted"
        ? "bg-amber-100 text-amber-700"
        : s === "contacted"
          ? "bg-sky-100 text-sky-700"
          : "bg-muted text-muted-foreground";

export default function AdminBulkOrdersPage() {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState<BulkRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bulk_order_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as BulkRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!term) return true;
      return [r.customer_name, r.phone, r.email, r.company, r.product_name]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [rows, q, status]);

  const patch = async (id: string, values: Partial<BulkRow>) => {
    const { error } = await supabase.from("bulk_order_requests").update(values).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)));
    setActive((prev) => (prev && prev.id === id ? { ...prev, ...values } : prev));
    toast.success("Updated");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("bulk_order_requests").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setActive(null);
    toast.success("Deleted");
  };

  return (
    <AdminShell>
      <div className="min-w-0 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">Bulk Orders</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} request{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, product..."
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm sm:w-44"
          >
            <option value="all">All status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-xl border border-border py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
            <Package className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No bulk order requests yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile / tablet cards */}
            <div className="grid gap-3 lg:hidden">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActive(r)}
                  className="rounded-xl border border-border p-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.customer_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.phone}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm">{r.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {r.qty} · {r.country_code} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Qty</th>
                    <th className="px-3 py-3">Market</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{r.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                      </td>
                      <td className="max-w-[240px] truncate px-3 py-3">{r.product_name}</td>
                      <td className="px-3 py-3">{r.qty}</td>
                      <td className="px-3 py-3">{r.country_code}</td>
                      <td className="px-3 py-3">
                        <select
                          value={r.status}
                          onChange={(e) => void patch(r.id, { status: e.target.value })}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(r.status)}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setActive(r)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-2xl bg-background p-4 sm:max-w-lg sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold">Bulk request</h2>
                <p className="truncate text-xs text-muted-foreground">{active.product_name}</p>
              </div>
              <button type="button" onClick={() => setActive(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Name", active.customer_name],
                ["Phone", active.phone],
                ["Email", active.email || "—"],
                ["Company", active.company || "—"],
                ["Quantity", String(active.qty)],
                ["Size", active.size || "—"],
                ["Color", active.color || "—"],
                ["Market", active.country_code],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0 rounded-lg border border-border p-2">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {active.notes && (
              <div className="mt-3 rounded-lg border border-border p-3 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Customization</p>
                <p className="mt-1 whitespace-pre-wrap">{active.notes}</p>
              </div>
            )}

            {active.product_link && (
              <a
                href={active.product_link}
                className="mt-3 inline-block text-sm underline underline-offset-4"
              >
                Open product
              </a>
            )}

            <label className="mt-4 block text-sm font-semibold">Status</label>
            <select
              value={active.status}
              onChange={(e) => void patch(active.id, { status: e.target.value })}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-sm font-semibold">Admin note</label>
            <textarea
              defaultValue={active.admin_note}
              onBlur={(e) => {
                if (e.target.value !== active.admin_note) void patch(active.id, { admin_note: e.target.value });
              }}
              className="mt-1 min-h-24 w-full rounded-lg border border-border bg-background p-3 text-sm"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void remove(active.id)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-destructive text-sm font-semibold text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="h-11 flex-1 rounded-lg bg-foreground text-sm font-semibold text-background"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
