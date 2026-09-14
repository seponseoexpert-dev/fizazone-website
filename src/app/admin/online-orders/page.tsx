"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Coins,
  FileDown,
  Loader2,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { resolveImage } from "@/lib/catalog";


type Item = {
  name: string;
  size: string;
  color: string;
  qty: number;
  unit_price: number;
  products?: { images: string[] | null; slug: string } | null;
};

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  created_at: string;
  order_items: Item[];
};

const money = (n: number) => `৳${Number(n).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const code = (id: string) => `FZ-${id.slice(0, 6).toUpperCase()}`;

const STATUSES = ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

function inRange(iso: string, range: RangeKey) {
  if (range === "all") return true;
  if (range === "today") return new Date(iso).toDateString() === new Date().toDateString();
  const days = range === "7d" ? 7 : 30;
  return Date.now() - new Date(iso).getTime() <= days * 86400_000;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "delivered") return "bg-brand-green/15 text-brand-forest";
  if (s === "cancelled" || s === "refunded") return "bg-destructive/10 text-destructive";
  if (s === "shipped") return "bg-blue-100 text-blue-700";
  if (s === "confirmed") return "bg-indigo-100 text-indigo-700";
  return "bg-amber-100 text-amber-700";
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(status)}`}
    >
      {status}
    </span>
  );
}

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeKey>("30d");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [active, setActive] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, customer_name, phone, address, payment_method, subtotal, delivery_fee, total, status, created_at, order_items(name, size, color, qty, unit_price, products(images, slug))",
      )
      .not("payment_method", "ilike", "POS%")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) {
        setAllowed(false);
        return;
      }
      const { data: ok } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      setAllowed(Boolean(ok));
      if (ok) await load();
      else setLoading(false);
    })();
  }, []);

  async function updateStatus(order: Order, status: string) {
    setSaving(true);
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    setActive((prev) => (prev && prev.id === order.id ? { ...prev, status } : prev));
    toast.success(`${code(order.id)} marked ${status}`);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        inRange(o.created_at, range) &&
        (statusFilter === "All" || o.status.toLowerCase() === statusFilter.toLowerCase()) &&
        (!q ||
          code(o.id).toLowerCase().includes(q) ||
          (o.customer_name ?? "").toLowerCase().includes(q) ||
          (o.phone ?? "").toLowerCase().includes(q)),
    );
  }, [orders, query, range, statusFilter]);

  const revenue = filtered.reduce((n, o) => n + Number(o.total), 0);
  const units = filtered.reduce(
    (n, o) => n + (o.order_items ?? []).reduce((m, i) => m + i.qty, 0),
    0,
  );
  const pending = filtered.filter((o) =>
    ["processing", "confirmed", "shipped"].includes(o.status.toLowerCase()),
  ).length;

  function exportCsv() {
    const rows = [
      ["Order", "Date", "Customer", "Phone", "Address", "Payment", "Items", "Total", "Status"],
      ...filtered.map((o) => [
        code(o.id),
        fmt(o.created_at),
        o.customer_name,
        o.phone,
        o.address ?? "",
        o.payment_method,
        String((o.order_items ?? []).reduce((n, i) => n + i.qty, 0)),
        String(o.total),
        o.status,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `online-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (allowed === false) {
    return (
      <AdminShell>
        <div className="rounded-2xl border border-border bg-background p-8 text-center">
          <p className="text-sm text-muted-foreground">Admin access required.</p>
        </div>
      </AdminShell>
    );
  }

  const stats = [
    { label: "Online orders", value: String(filtered.length), icon: ClipboardList },
    { label: "Revenue", value: money(revenue), icon: Coins },
    { label: "Units sold", value: String(units), icon: ShoppingBag },
    { label: "Open orders", value: String(pending), icon: ClipboardList },
  ];

  return (
    <AdminShell>
      <div className="space-y-4">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-black text-foreground sm:text-2xl">
              Online Orders
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Every order placed from the website checkout.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => void load()}
              className="rounded-xl border border-border bg-background p-2.5"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold sm:text-sm"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-background p-3 sm:p-4">
              <div className="flex min-w-0 items-center gap-2">
                <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
              </div>
              <p className="mt-1.5 truncate text-lg font-black text-foreground sm:text-xl">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-background p-3 sm:p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order code, customer or phone…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  range === r.key
                    ? "border-sale bg-sale/10 text-sale"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === s
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-2xl border border-border bg-background py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background py-16 text-center text-sm text-muted-foreground">
            No online orders in this period.
          </div>
        ) : (
          <>
            {/* Mobile / tablet cards */}
            <ul className="space-y-3 lg:hidden">
              {filtered.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setActive(o)}
                    className="w-full rounded-2xl border border-border bg-background p-3 text-left"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{code(o.id)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {o.customer_name} · {o.phone}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{fmt(o.created_at)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-foreground">{money(o.total)}</p>
                        <div className="mt-1">
                          <StatusPill status={o.status} />
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 truncate text-[11px] text-muted-foreground">
                      {o.payment_method} ·{" "}
                      {(o.order_items ?? []).reduce((n, i) => n + i.qty, 0)} item(s)
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-background lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Payment</th>
                      <th className="px-4 py-3 text-center font-semibold">Items</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => setActive(o)}
                        className="cursor-pointer border-t border-border hover:bg-secondary/40"
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">{code(o.id)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(o.created_at)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{o.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{o.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{o.payment_method}</td>
                        <td className="px-4 py-3 text-center">
                          {(o.order_items ?? []).reduce((n, i) => n + i.qty, 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {money(o.total)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail drawer */}
      {active && (
        <div className="fixed inset-0 z-50 grid place-items-end print:hidden sm:place-items-center">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setActive(null)}
          />
          <div className="relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-background p-4 sm:max-w-md sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black uppercase tracking-wide text-foreground">
                  {code(active.id)}
                </h2>
                <p className="text-[11px] text-muted-foreground">{fmt(active.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => window.print()}
                  aria-label="Print invoice"
                  className="rounded-lg p-2 hover:bg-secondary"
                >
                  <Printer className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="rounded-lg p-2 hover:bg-secondary"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-semibold text-foreground">{active.customer_name}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{active.phone}</span>
                </p>
                {active.address && (
                  <p className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{active.address}</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Payment: <span className="font-semibold">{active.payment_method}</span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Update status
                </p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={saving}
                      onClick={() => void updateStatus(active, s)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                        active.status.toLowerCase() === s.toLowerCase()
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <Receipt order={active} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print-only invoice */}
      {active && (
        <div className="hidden print:fixed print:inset-0 print:z-50 print:block print:bg-white print:p-0">
          <div className="mx-auto w-[80mm] px-2 py-3">
            <Receipt order={active} />
          </div>
        </div>
      )}
    </AdminShell>
  );
}

const STORE = {
  name: "FAIZA ZONE",
  tagline: "Online Shopping & Gift Store",
  address: "Chowmuhani Bazar, Hajirhat Bazar, Dularhat\nCharfassion, Bhola - 8340",
  tel: "Mobile: +880 1798-113899",
};

function Receipt({ order }: { order: Order }) {
  const items = order.order_items ?? [];
  const units = items.reduce((n, i) => n + i.qty, 0);

  return (
    <div className="mx-auto w-full max-w-[300px] font-mono text-[11px] leading-tight text-foreground">
      <div className="text-center">
        <p className="text-base font-black uppercase tracking-wide">{STORE.name}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
          {STORE.tagline}
        </p>
        {STORE.address.split("\n").map((line, i) => (
          <p key={i} className="mt-1.5 text-[10px] text-muted-foreground first:mt-1.5">
            {line}
          </p>
        ))}
        <p className="text-[10px] text-muted-foreground">{STORE.tel}</p>
      </div>

      <div className="my-2 border-t border-dashed border-foreground/40" />

      <div className="flex items-center justify-between text-[10px]">
        <span className="font-bold">Order ID #{code(order.id)}</span>
        <span className="text-muted-foreground">{fmt(order.created_at)}</span>
      </div>

      <div className="my-2 border-t border-dashed border-foreground/40" />

      <table className="w-full">
        <thead>
          <tr className="text-[10px] uppercase">
            <th className="w-9 pb-1 text-left font-bold" />
            <th className="w-8 pb-1 text-left font-bold">Qty</th>
            <th className="pb-1 text-left font-bold">Product Description</th>
            <th className="pb-1 text-right font-bold">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-1 pr-1.5">
                <img
                  src={resolveImage(i.products?.images?.[0], i.products?.slug ?? i.name)}
                  alt={i.name}
                  className="h-8 w-8 rounded border border-foreground/20 object-cover"
                />
              </td>
              <td className="py-1">{i.qty}</td>
              <td className="py-1 pr-2">
                <p className="font-semibold">{i.name}</p>
                {(i.size || i.color) && (
                  <p className="text-[10px] text-muted-foreground">
                    {[i.color, i.size].filter(Boolean).join(" | ")}
                  </p>
                )}
              </td>
              <td className="py-1 text-right font-semibold">{money(i.qty * Number(i.unit_price))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-2 border-t border-dashed border-foreground/40" />

      <div className="space-y-0.5 text-[11px]">
        <Row label="SUBTOTAL:" value={money(order.subtotal)} />
        <Row label="DELIVERY:" value={money(order.delivery_fee ?? 0)} />
        <div className="mt-1 border-t border-dashed border-foreground/40 pt-1">
          <Row label="TOTAL:" value={money(order.total)} bold />
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-foreground/40" />

      <div className="text-[10px]">
        <Row label="Payment Type:" value={order.payment_method} />
        <Row label="Status:" value={order.status} />
        <Row label="Items:" value={String(units)} />
        <Row label="Customer:" value={order.customer_name} />
        {order.phone && <Row label="Phone:" value={order.phone} />}
      </div>

      <div className="mt-3 text-center">
        <p className="text-[12px] font-black uppercase">THANK YOU</p>
        <p className="text-[10px] uppercase text-muted-foreground">Please Come Again</p>
        <p className="mt-2 text-[9px] text-muted-foreground">
          Thank you for shopping with Faiza Zone
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "text-[13px] font-black" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
