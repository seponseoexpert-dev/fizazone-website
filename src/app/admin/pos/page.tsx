"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { CATEGORIES, fetchProducts, type AdminProduct, type Variant } from "@/lib/admin-products";
import { resolveImage } from "@/lib/catalog";


type Line = {
  key: string;
  productId: string;
  variantId: string | null;
  name: string;
  size: string;
  color: string;
  price: number;
  qty: number;
  stock: number;
  image: string;
};

const PAYMENTS = ["Cash", "bKash", "Nagad", "Card"] as const;
const money = (n: number) => `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

function priceOf(p: AdminProduct) {
  return Number(p.sale_price ?? p.price ?? 0);
}

export default function AdminPosPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [lines, setLines] = useState<Line[]>([]);
  const [picking, setPicking] = useState<AdminProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [customer, setCustomer] = useState("Walk-in customer");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<string>("Cash");
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

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
      if (!ok) return;
      try {
        setProducts(await fetchProducts());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "ALL" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)),
    );
  }, [products, query, category]);

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  function addLine(p: AdminProduct, v: Variant | null) {
    const key = `${p.id}|${v?.id ?? ""}`;
    const stock = v?.stock_qty ?? 9999;
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) {
        if (found.qty + 1 > found.stock) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      }
      if (stock <= 0) {
        toast.error("Out of stock");
        return prev;
      }
      return [
        ...prev,
        {
          key,
          productId: p.id,
          variantId: v?.id ?? null,
          name: p.name,
          size: v?.size ?? "",
          color: v?.color ?? "",
          price: priceOf(p),
          qty: 1,
          stock,
          image: resolveImage(p.images?.[0], p.slug),
        },
      ];
    });
    setPicking(null);
  }

  function onPick(p: AdminProduct) {
    const variants = (p.product_variants ?? []).filter((v) => v.id);
    if (variants.length === 0) return addLine(p, null);
    if (variants.length === 1) return addLine(p, variants[0]!);
    setPicking(p);
  }

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      prev.flatMap((l) =>
        l.key === key ? (qty <= 0 ? [] : [{ ...l, qty: Math.min(qty, l.stock) }]) : [l],
      ),
    );
  }

  async function checkout() {
    if (!lines.length) {
      toast.error("Cart is empty");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Session expired");

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: uid,
          customer_name: customer.trim() || "Walk-in customer",
          phone: phone.trim() || "N/A",
          address: "In-store (POS)",
          payment_method: `POS · ${payment}`,
          subtotal,
          delivery_fee: 0,
          total,
          status: "Completed",
          country_code: "bd",
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id as string,
          product_id: l.productId,
          variant_id: l.variantId,
          name: l.name,
          size: l.size,
          color: l.color,
          qty: l.qty,
          unit_price: l.price,
        })),
      );
      if (itemsError) throw itemsError;

      toast.success(`Sale completed · ${money(total)}`);
      setLines([]);
      setDiscount(0);
      setPhone("");
      setCustomer("Walk-in customer");
      setCartOpen(false);
      setProducts(await fetchProducts());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not complete the sale");
    } finally {
      setSaving(false);
    }
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

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-foreground">
          <ShoppingCart className="h-4 w-4 shrink-0" />
          <span className="truncate">Current sale ({count})</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {lines.length > 0 && (
            <button
              onClick={() => setLines([])}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              Clear
            </button>
          )}
          <button
            className="rounded-lg border border-border p-1.5 xl:hidden"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {lines.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Tap a product to start a sale.
          </p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l.key} className="rounded-xl border border-border p-3">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
                  <img
                    src={l.image}
                    alt={l.name}
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{l.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[l.size, l.color].filter(Boolean).join(" · ") || "Default"} ·{" "}
                      {money(l.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => setQty(l.key, 0)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 rounded-lg border border-border">
                    <button
                      className="p-2"
                      onClick={() => setQty(l.key, l.qty - 1)}
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                    <button
                      className="p-2"
                      onClick={() => setQty(l.key, l.qty + 1)}
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {money(l.price * l.qty)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-border px-4 py-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Customer name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile number"
            inputMode="tel"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {PAYMENTS.map((p) => (
            <button
              key={p}
              onClick={() => setPayment(p)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                payment === p
                  ? "border-sale bg-sale/10 text-sale"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-muted-foreground">
            <span>Discount</span>
            <input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm"
            />
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
        </div>

        <button
          onClick={() => void checkout()}
          disabled={saving || !lines.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-forest px-4 py-3 text-sm font-bold text-primary-foreground transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
          Complete sale · {money(total)}
        </button>
      </div>
    </div>
  );

  return (
    <AdminShell>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-foreground sm:text-2xl">
                POS Terminal
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                In-store sales — stock updates automatically.
              </p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative shrink-0 rounded-xl border border-border bg-background p-2.5 xl:hidden"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-sale text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
          </header>

          <div className="space-y-3 rounded-2xl border border-border bg-background p-3 sm:p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product or scan code…"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["ALL", ...CATEGORIES].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    category === c
                      ? "border-sale bg-sale/10 text-sale"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {c}
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
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => {
                const stock = (p.product_variants ?? []).reduce(
                  (n, v) => n + (v.stock_qty ?? 0),
                  0,
                );
                return (
                  <button
                    key={p.id}
                    onClick={() => onPick(p)}
                    className="group overflow-hidden rounded-2xl border border-border bg-background text-left transition hover:border-sale"
                  >
                    <img
                      src={resolveImage(p.images?.[0], p.slug)}
                      alt={p.name}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                    <div className="space-y-1 p-2.5">
                      <p className="line-clamp-2 text-xs font-semibold text-foreground sm:text-sm">
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-sale">{money(priceOf(p))}</span>
                        <span
                          className={`shrink-0 text-[10px] font-semibold ${
                            stock > 0 ? "text-muted-foreground" : "text-destructive"
                          }`}
                        >
                          {stock > 0 ? `${stock} left` : "Out"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Desktop cart */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 h-[calc(100vh-6.5rem)] overflow-hidden rounded-2xl border border-border bg-background">
            {cartPanel}
          </div>
        </aside>
      </div>

      {/* Mobile / tablet cart sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            aria-label="Close cart"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setCartOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-2xl bg-background sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-96 sm:rounded-none">
            <div className="h-[88vh] sm:h-full">{cartPanel}</div>
          </div>
        </div>
      )}

      {/* Mobile sticky checkout bar */}
      {!cartOpen && count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3 xl:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-brand-forest px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            <span>{count} item{count > 1 ? "s" : ""}</span>
            <span>Review sale · {money(total)}</span>
          </button>
        </div>
      )}

      {/* Variant picker */}
      {picking && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setPicking(null)}
          />
          <div className="relative z-10 w-full rounded-t-2xl bg-background p-4 sm:max-w-md sm:rounded-2xl">
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h3 className="truncate text-sm font-bold text-foreground">{picking.name}</h3>
              <button onClick={() => setPicking(null)} aria-label="Close" className="shrink-0">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid max-h-[55vh] gap-2 overflow-y-auto sm:grid-cols-2">
              {(picking.product_variants ?? []).map((v) => (
                <button
                  key={v.id}
                  disabled={(v.stock_qty ?? 0) <= 0}
                  onClick={() => addLine(picking, v)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-left text-sm transition hover:border-sale disabled:opacity-40"
                >
                  <span className="truncate font-semibold text-foreground">
                    {[v.size, v.color].filter(Boolean).join(" · ") || "Default"}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{v.stock_qty ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
