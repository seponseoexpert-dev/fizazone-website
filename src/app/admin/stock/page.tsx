"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  FileDown,
  Loader2,
  Minus,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { CATEGORIES, fetchProducts, type AdminProduct } from "@/lib/admin-products";


const LOW_STOCK = 5;

type Row = {
  variantId: string;
  productId: string;
  product: string;
  category: string;
  size: string;
  color: string;
  qty: number;
  price: number;
};

type StatusFilter = "all" | "in" | "low" | "out";

function toRows(products: AdminProduct[]): Row[] {
  const rows: Row[] = [];
  for (const p of products) {
    for (const v of p.product_variants ?? []) {
      if (!v.id) continue;
      rows.push({
        variantId: v.id,
        productId: p.id,
        product: p.name,
        category: p.category,
        size: v.size || "—",
        color: v.color || "—",
        qty: v.stock_qty ?? 0,
        price: Number(p.sale_price ?? p.price ?? 0),
      });
    }
  }
  return rows.sort((a, b) => a.product.localeCompare(b.product) || a.size.localeCompare(b.size));
}

function statusOf(qty: number): StatusFilter {
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK) return "low";
  return "in";
}

function StatusPill({ qty }: { qty: number }) {
  const s = statusOf(qty);
  const map = {
    in: "bg-brand-green/15 text-brand-forest",
    low: "bg-amber-100 text-amber-700",
    out: "bg-destructive/10 text-destructive",
    all: "",
  } as const;
  const label = s === "in" ? "In stock" : s === "low" ? "Low" : "Out of stock";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[s]}`}>
      {label}
    </span>
  );
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      setProducts(await fetchProducts());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-stock")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_variants" },
        () => void load(false),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const rows = useMemo(() => toRows(products), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "ALL" && r.category !== category) return false;
      if (status !== "all" && statusOf(r.qty) !== status) return false;
      if (!q) return true;
      return (
        r.product.toLowerCase().includes(q) ||
        r.size.toLowerCase().includes(q) ||
        r.color.toLowerCase().includes(q)
      );
    });
  }, [rows, query, category, status]);

  const stats = useMemo(() => {
    const units = rows.reduce((s, r) => s + Math.max(0, r.qty), 0);
    return {
      variants: rows.length,
      units,
      low: rows.filter((r) => statusOf(r.qty) === "low").length,
      out: rows.filter((r) => statusOf(r.qty) === "out").length,
      value: rows.reduce((s, r) => s + Math.max(0, r.qty) * r.price, 0),
    };
  }, [rows]);

  function setDraft(id: string, value: number) {
    setDrafts((d) => ({ ...d, [id]: Math.max(0, Math.round(value)) }));
  }

  async function save(row: Row) {
    const next = drafts[row.variantId];
    if (next === undefined || next === row.qty) return;
    setSaving(row.variantId);
    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ stock_qty: next })
        .eq("id", row.variantId);
      if (error) throw error;
      setProducts((prev) =>
        prev.map((p) =>
          p.id === row.productId
            ? {
                ...p,
                product_variants: (p.product_variants ?? []).map((v) =>
                  v.id === row.variantId ? { ...v, stock_qty: next } : v,
                ),
              }
            : p,
        ),
      );
      setDrafts((d) => {
        const copy = { ...d };
        delete copy[row.variantId];
        return copy;
      });
      toast.success(`${row.product} · ${row.size}/${row.color} → ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Stock update failed");
    } finally {
      setSaving(null);
    }
  }

  function exportCsv() {
    const header = "product,category,size,color,stock_qty,status";
    const body = filtered
      .map((r) =>
        [r.product, r.category, r.size, r.color, r.qty, statusOf(r.qty)]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const tiles = [
    { label: "Variants", value: String(stats.variants), icon: Boxes, tone: "text-brand-forest" },
    { label: "Total units", value: String(stats.units), icon: TrendingDown, tone: "text-sale" },
    { label: "Low stock", value: String(stats.low), icon: AlertTriangle, tone: "text-amber-600" },
    { label: "Out of stock", value: String(stats.out), icon: PackageX, tone: "text-destructive" },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
              Stock Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Live inventory per size &amp; colour · stock updates automatically when orders are placed.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void load()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-semibold text-background"
            >
              <FileDown className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
                <t.icon className={`h-4 w-4 ${t.tone}`} />
              </div>
              <p className="mt-2 text-xl font-extrabold text-foreground sm:text-2xl">{t.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product, size or colour"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-sale"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="ALL">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary p-1">
              {(["all", "in", "low", "out"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    status === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {s === "in" ? "In stock" : s === "out" ? "Out" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-xl border border-border bg-background py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background py-16 text-center text-sm text-muted-foreground">
            No stock rows match your filters.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-background lg:block">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Colour</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const draft = drafts[r.variantId] ?? r.qty;
                    const dirty = draft !== r.qty;
                    return (
                      <tr key={r.variantId} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 font-medium text-foreground">{r.product}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                        <td className="px-4 py-3">{r.size}</td>
                        <td className="px-4 py-3">{r.color}</td>
                        <td className="px-4 py-3">
                          <StatusPill qty={r.qty} />
                        </td>
                        <td className="px-4 py-3">
                          <StockEditor
                            value={draft}
                            dirty={dirty}
                            busy={saving === r.variantId}
                            onChange={(v) => setDraft(r.variantId, v)}
                            onSave={() => void save(r)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filtered.map((r) => {
                const draft = drafts[r.variantId] ?? r.qty;
                const dirty = draft !== r.qty;
                return (
                  <div key={r.variantId} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{r.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.category} · {r.size} / {r.color}
                        </p>
                      </div>
                      <StatusPill qty={r.qty} />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <StockEditor
                        value={draft}
                        dirty={dirty}
                        busy={saving === r.variantId}
                        onChange={(v) => setDraft(r.variantId, v)}
                        onSave={() => void save(r)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function StockEditor({
  value,
  dirty,
  busy,
  onChange,
  onSave,
}: {
  value: number;
  dirty: boolean;
  busy: boolean;
  onChange: (value: number) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          aria-label="Decrease stock"
          onClick={() => onChange(value - 1)}
          className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          value={value}
          inputMode="numeric"
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
          className="h-9 w-14 border-x border-border bg-background text-center text-sm outline-none"
          aria-label="Stock quantity"
        />
        <button
          type="button"
          aria-label="Increase stock"
          onClick={() => onChange(value + 1)}
          className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        disabled={!dirty || busy}
        onClick={onSave}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-3 text-xs font-semibold text-background disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Save
      </button>
    </div>
  );
}
