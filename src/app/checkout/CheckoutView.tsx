"use client";

import { useState } from "react";
import { Link } from "@/components/ui/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { Header } from "@/components/shop/Header";
import { lineKey, useCart } from "@/components/shop/cart";
import { useCoupon } from "@/components/shop/useCoupon";
import { cn } from "@/lib/utils";
import { placeOrder as placeOrderFn } from "@/lib/orders.functions";
import { startEpsPayment } from "@/lib/eps.functions";
import { useCountry } from "@/lib/country";
import { IntlCheckout } from "@/components/shop/IntlCheckout";

const DELIVERY_FEE = 100;

const PAYMENTS = [
  {
    id: "cod",
    label: "Cash on Delivery",
    note: "Pay in cash when your order arrives",
    icon: Banknote,
    badges: null,
  },
  {
    id: "eps",
    label: "Eps Payment",
    note: "Full payment online via secure gateway",
    icon: CreditCard,
    badges: ["Card", "bKash", "Nagad", "Rocket"],
  },
] as const;

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-sale">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-sale";

export function CheckoutView() {
  const { country } = useCountry();
  if (country.code !== "bd") return <IntlCheckout code={country.code} />;
  return <BdCheckout />;
}

function BdCheckout() {
  const { items, subtotal, count, clear, setQty, remove } = useCart();
  const [coupon, setCoupon] = useState("");
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]["id"]>("cod");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [placedTotal, setPlacedTotal] = useState(0);

  const {
    applied,
    error: couponError,
    loading: couponLoading,
    apply,
    clearCoupon,
    discount,
  } = useCoupon(subtotal);
  const shipping = DELIVERY_FEE;
  const total = Math.max(0, subtotal - discount) + shipping;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const placeOrder = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e["name"] = "Enter your full name";
    if (!/^01[3-9]\d{8}$/.test(form.phone.replace(/\s|-/g, "")))
      e["phone"] = "Enter a valid 11-digit mobile number";
    if (form.address.trim().length < 10) e["address"] = "Enter detailed address (house, road, area)";
    if (items.length === 0) e["cart"] = "Your cart is empty";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setPlacing(true);
    try {
      const isUuid = (v: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const result = await placeOrderFn({
        customer_name: form.name.trim(),
        phone: form.phone.replace(/\s|-/g, ""),
        address: `${form.address.trim()}${form.note.trim() ? ` — Note: ${form.note.trim()}` : ""}`,
        payment_method: payment,
        delivery_fee: shipping,
        coupon_code: applied?.code ?? null,
        items: items.map((i) => ({
          product_id: isUuid(i.id) ? i.id : null,
          name: i.name,
          size: i.size ?? "",
          color: i.color ?? "",
          qty: i.qty,
          unit_price: i.price,
        })),
      });
      if (payment === "eps") {
        const { redirectUrl } = await startEpsPayment({ order_id: result.id });
        clear();
        clearCoupon();
        window.location.href = redirectUrl;
        return;
      }
      setPlacedTotal(result.total);
      setOrderId(result.code);
      clear();
      clearCoupon();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrors({ cart: err instanceof Error ? err.message : "Could not place the order. Try again." });
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <div className="min-h-screen bg-background pb-10 lg:pb-0">
        <Header />
        <main className="shop-container py-10">
          <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-border bg-card px-5 py-12 text-center card-elevated">
            <CheckCircle2 className="h-12 w-12 text-brand-green" />
            <h1 className="mt-4 text-xl font-extrabold">Order confirmed!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order ID <span className="font-bold text-foreground">#{orderId}</span> — our team will contact you by
              phone shortly.
            </p>
            <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
              {payment === "cod"
                ? `Total ৳${placedTotal.toFixed(0)} will be collected in cash on delivery.`
                : "Full payment complete."}
            </p>
            <Link
              to="/categories"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-sale px-6 text-sm font-semibold text-primary-foreground"
            >
              Continue shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-10 lg:pb-0">
        <Header />
        <main className="shop-container py-10">
          <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-dashed border-border px-5 py-14 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-base font-bold">Your cart is empty</h1>
            <p className="mt-1 text-sm text-muted-foreground">Add products before checkout.</p>
            <Link
              to="/categories"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-sale px-6 text-xs font-semibold text-primary-foreground"
            >
              Start shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-0">
      <Header />

      <main className="shop-container py-5 sm:py-8">
        <h1 className="sr-only">Checkout</h1>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          <div className="grid min-w-0 gap-5">
            {/* Delivery details */}
            <section className="rounded-2xl border border-border bg-card p-4 card-elevated sm:p-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Delivery Information
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                  />
                  {errors["name"] && <span className="text-[11px] text-sale">{errors["name"]}</span>}
                </Field>
                <Field label="Mobile number" required hint="Ex: 01712345678">
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                  {errors["phone"] && <span className="text-[11px] text-sale">{errors["phone"]}</span>}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Full address" required hint="House / Road / Area / Thana">
                    <textarea
                      className="min-h-24 w-full min-w-0 rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-sale"
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                    />
                    {errors["address"] && <span className="text-[11px] text-sale">{errors["address"]}</span>}
                  </Field>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-border bg-card p-4 card-elevated sm:p-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Payment Option
              </h2>
              <div className="mt-4 grid gap-3">
                {PAYMENTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayment(p.id)}
                    className={cn(
                      "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      payment === p.id
                        ? "border-sale bg-sale/5 ring-1 ring-sale/20"
                        : "border-border hover:border-sale/60 hover:bg-secondary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors",
                        payment === p.id ? "bg-sale text-primary-foreground" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <p.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{p.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{p.note}</span>
                      {p.badges && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {p.badges.map((b) => (
                            <span
                              key={b}
                              className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {b}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                        payment === p.id ? "border-sale bg-sale" : "border-border",
                      )}
                    >
                      {payment === p.id && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-secondary p-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {payment === "cod" ? (
                    <>
                      <span className="font-semibold text-foreground">Cash on Delivery:</span> You will pay{" "}
                      <span className="font-semibold text-foreground">৳{total.toFixed(0)}</span> in cash when your
                      order is delivered.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">Eps Payment:</span> After confirming, you will
                      be redirected to a secure gateway to pay{" "}
                      <span className="font-semibold text-foreground">৳{total.toFixed(0)}</span> by card or mobile
                      banking.
                    </>
                  )}
                </p>
              </div>

              <div className="mt-4">
                <Field label="Order note">
                  <textarea
                    className="min-h-20 w-full min-w-0 rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-sale"
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                    placeholder="Delivery time or other instructions (optional)"
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="rounded-2xl border border-border bg-card p-4 card-elevated sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-extrabold tracking-tight">Order Summary</h2>

            <ul className="mt-5 grid gap-4 border-b border-border pb-5">
              {items.map((i) => {
                const key = lineKey(i);
                return (
                  <li key={key} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3">
                    <img
                      src={i.image}
                      alt={i.name}
                      width={112}
                      height={112}
                      loading="lazy"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{i.name}</p>
                      {(i.size || i.color) && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[i.size, i.color].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      <div className="mt-2 inline-flex items-center rounded-lg border border-border">
                        <button
                          type="button"
                          aria-label={`Decrease ${i.name}`}
                          onClick={() => setQty(key, i.qty - 1)}
                          className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${i.name}`}
                          onClick={() => setQty(key, i.qty + 1)}
                          className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid justify-items-end gap-4">
                      <button
                        type="button"
                        aria-label={`Remove ${i.name}`}
                        onClick={() => remove(key)}
                        className="text-muted-foreground transition-colors hover:text-sale"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <p className="shrink-0 text-sm font-bold">৳{(i.price * i.qty).toFixed(0)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 border-b border-border pb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Coupon code
              </p>
              {applied ? (
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-brand-mist px-3 py-2.5">
                  <p className="min-w-0 truncate text-xs font-semibold text-brand-forest">
                    {applied.code.toUpperCase()} applied · −৳{discount.toFixed(0)}
                  </p>
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="shrink-0 text-[11px] font-bold uppercase text-muted-foreground hover:text-sale"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <input
                      className={inputCls}
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void apply(coupon);
                      }}
                      placeholder="Enter code"
                      aria-label="Coupon code"
                    />
                    <button
                      type="button"
                      disabled={couponLoading}
                      onClick={() => void apply(coupon)}
                      className="h-11 shrink-0 rounded-xl bg-foreground px-5 text-xs font-bold uppercase tracking-[0.1em] text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="mt-2 text-xs font-medium text-sale">{couponError}</p>}
                </>
              )}
            </div>

            <dl className="mt-5 grid gap-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal ({count} items)</dt>
                <dd className="font-semibold">৳{subtotal.toFixed(0)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Promo ({applied?.code.toUpperCase()})</dt>
                  <dd className="font-semibold text-brand-forest">−৳{discount.toFixed(0)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">
                  Delivery <span className="text-[11px]">(flat rate)</span>
                </dt>
                <dd className="font-semibold">৳{shipping}</dd>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3 text-lg">
                <dt className="font-extrabold">Total</dt>
                <dd className="font-extrabold">৳{total.toFixed(0)}</dd>
              </div>
            </dl>

            {errors["cart"] && (
              <p className="mt-4 rounded-lg bg-sale/10 px-3 py-2 text-xs font-medium text-sale">{errors["cart"]}</p>
            )}

            <div className="mt-5 hidden lg:block">
              <button
                type="button"
                onClick={placeOrder}
                disabled={placing}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-forest text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Place Order · ৳{total.toFixed(0)}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-forest" />
                Secure SSL checkout · 100% safe payments
              </p>
              <Link
                to="/cart"
                className="mt-3 flex h-11 items-center justify-center rounded-xl border border-border text-xs font-bold uppercase tracking-[0.1em] transition-colors hover:bg-secondary"
              >
                Review order
              </Link>
            </div>

            <ul className="mt-5 grid gap-2.5 border-t border-border pt-4">
              {[
                { icon: Truck, text: "Fast delivery across Bangladesh" },
                { icon: ShieldCheck, text: "Easy return & refund within 7 days" },
              ].map((f) => (
                <li key={f.text} className="flex min-w-0 items-center gap-2">
                  <f.icon className="h-4 w-4 shrink-0 text-sale" />
                  <span className="min-w-0 text-xs text-muted-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      {/* Mobile sticky confirm */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={placeOrder}
          disabled={placing}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-forest text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Place Order · ৳{total.toFixed(0)}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-forest" />
          Secure SSL checkout · 100% safe payments
        </p>
      </div>
    </div>
  );
}
