"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/ui/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";

import { FlagIcon } from "@/components/shop/FlagIcon";
import { useCart } from "@/components/shop/cart";
import { useCoupon } from "@/components/shop/useCoupon";
import { placeOrder as placeOrderFn } from "@/lib/orders.functions";
import { startEpsPayment } from "@/lib/eps.functions";
import { useCountry } from "@/lib/country";
import { useActiveCountryCodes } from "@/lib/active-countries";
import {
  INTL_COUNTRIES,
  PAYMENT_LABELS,
  etaLabel,
  useShippingZones,
  type IntlCountryCode,
} from "@/lib/intl-checkout";
import { cn } from "@/lib/utils";

const inputCls =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-sale";

function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid min-w-0 gap-1.5", className)}>
      <span className="text-xs font-semibold text-foreground">
        {label} {required && <span className="text-sale">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] font-medium text-sale">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function IntlCheckout({ code }: { code: IntlCountryCode }) {
  const { items, subtotal, count, clear, remove, setQty } = useCart();
  const { setCountry } = useCountry();
  const { codes } = useActiveCountryCodes();
  const zones = useShippingZones();
  const [zoneCode, setZoneCode] = useState<string>(code);
  const cfg =
    zones.find((z) => z.code === zoneCode) ?? zones.find((z) => z.code === code) ?? zones[0]!;
  const freeOver = cfg.freeOver > 0 ? cfg.freeOver : null;
  const { applied, discount, clearCoupon } = useCoupon(subtotal);

  const [ship, setShip] = useState<"standard" | "express">("standard");
  const [selectedPayment, setPayment] = useState<string>("eps");
  const payment = cfg.payments.includes(selectedPayment) ? selectedPayment : (cfg.payments[0] ?? "card");
  const [offers, setOffers] = useState(true);
  const [billingSame, setBillingSame] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    billingAddress: "",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const money = (n: number) => `${cfg.symbol}${n.toFixed(2)}`;
  
  const conv = (bdt: number) => Math.round(bdt * cfg.rate * 100) / 100;

  const netSubtotal = conv(Math.max(0, subtotal - discount));
  const method = ship === "express" ? cfg.express : cfg.standard;
  const shipping = freeOver && netSubtotal >= freeOver ? 0 : method.cost;
  const tax = Math.round(netSubtotal * cfg.taxRate * 100) / 100;
  const total = Math.round((netSubtotal + shipping + tax) * 100) / 100;

  /** Built-in markets are gated by the admin Countries toggle; custom zones always show. */
  const options = useMemo(
    () =>
      zones.filter(
        (z) => !(z.code in INTL_COUNTRIES) || codes.includes(z.code as IntlCountryCode),
      ),
    [zones, codes],
  );

  const submitOrder = placeOrderFn;
  const startEps = startEpsPayment;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.email.trim())) e["email"] = "Enter a valid email address";
    if (form.firstName.trim().length < 2) e["firstName"] = "Required";
    if (form.lastName.trim().length < 2) e["lastName"] = "Required";
    if (form.address.trim().length < 5) e["address"] = "Enter your street address";
    if (form.city.trim().length < 2) e["city"] = "Required";
    if (!form.state.trim()) e["state"] = `Select your ${cfg.stateLabel.toLowerCase()}`;
    if (!cfg.zipPattern.test(form.zip.trim())) e["zip"] = `Enter a valid ${cfg.zipLabel.toLowerCase()}`;
    if (form.phone.replace(/\D/g, "").length < 7) e["phone"] = "Enter a valid phone number";
    if (payment === "card") {
      if (form.cardNumber.replace(/\s/g, "").length < 13) e["cardNumber"] = "Enter a valid card number";
      if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(form.expiry.trim())) e["expiry"] = "MM/YY";
      if (!/^\d{3,4}$/.test(form.cvv.trim())) e["cvv"] = "3–4 digits";
      if (!billingSame && form.billingAddress.trim().length < 5) e["billingAddress"] = "Enter billing address";
    }
    if (items.length === 0) e["cart"] = "Your cart is empty";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const isUuid = (v: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      const address = [
        form.address.trim(),
        form.apartment.trim(),
        `${form.city.trim()}, ${form.state.trim()} ${form.zip.trim()}`,
        cfg.name,
        `Email: ${form.email.trim()}`,
        `Shipping: ${ship === "express" ? "Express" : "Standard"} (${money(shipping)})`,
      ]
        .filter(Boolean)
        .join(", ");

      const result = await submitOrder({
        data: {
          customer_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          phone: `${cfg.phoneCode} ${form.phone.trim()}`,
          address: address.slice(0, 500),
          payment_method: payment,
          delivery_fee: Math.round(shipping / cfg.rate),
          coupon_code: applied?.code ?? null,
          items: items.map((i) => ({
            product_id: isUuid(i.id) ? i.id : null,
            name: i.name,
            size: i.size ?? "",
            color: i.color ?? "",
            qty: i.qty,
            unit_price: i.price,
          })),
        },
      });
      if (payment === "eps") {
        // Hosted EPS checkout — the customer completes payment on the gateway.
        const { redirectUrl } = await startEps({ data: { order_id: result.id } });
        clear();
        clearCoupon();
        window.location.href = redirectUrl;
        return;
      }
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
      <Shell>
        <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-border bg-card px-5 py-12 text-center card-elevated">
          <CheckCircle2 className="h-12 w-12 text-brand-green" />
          <h1 className="mt-4 text-xl font-extrabold">Thank you for your order!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order <span className="font-bold text-foreground">#{orderId}</span> — a confirmation email is on its way.
          </p>
          <Link
            to="/categories"
            search={{ category: undefined }}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-sale px-6 text-sm font-semibold text-primary-foreground"
          >
            Continue shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  if (items.length === 0) {
    return (
      <Shell>
        <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-dashed border-border px-5 py-14 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-base font-bold">Your cart is empty</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add products before checkout.</p>
          <Link
            to="/categories"
            search={{ category: undefined }}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-sale px-6 text-xs font-semibold text-primary-foreground"
          >
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-10">
        <div className="grid min-w-0 gap-5">
          {/* Contact */}
          <Card title="Contact information" step={1}>
            <Field label="Email address" required error={errors["email"]}>
              <input
                className={inputCls}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <label className="mt-3 flex items-start gap-2.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[hsl(var(--sale))]"
                checked={offers}
                onChange={(e) => setOffers(e.target.checked)}
              />
              Email me with news, updates and offers (optional)
            </label>
          </Card>

          {/* Address */}
          <Card title="Delivery address" step={2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country / Region" required className="sm:col-span-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <FlagIcon code={cfg.code} className="h-5 w-5" />
                  </span>
                  <select
                    className={cn(inputCls, "pl-10")}
                    value={cfg.code}
                    onChange={(e) => {
                      const next = e.target.value;
                      setZoneCode(next);
                      setForm((f) => ({ ...f, state: "" }));
                      if (next in INTL_COUNTRIES) setCountry(next as IntlCountryCode);
                    }}
                  >
                    {(options.length ? options : zones).map((z) => (
                      <option key={z.code} value={z.code}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="First name" required error={errors["firstName"]}>
                <input
                  className={inputCls}
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last name" required error={errors["lastName"]}>
                <input
                  className={inputCls}
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
              <Field label="Address" required error={errors["address"]} className="sm:col-span-2">
                <input
                  className={inputCls}
                  autoComplete="address-line1"
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <Field label="Apartment, suite, etc. (optional)" className="sm:col-span-2">
                <input
                  className={inputCls}
                  autoComplete="address-line2"
                  value={form.apartment}
                  onChange={(e) => set("apartment", e.target.value)}
                />
              </Field>
              <Field label="City" required error={errors["city"]}>
                <input
                  className={inputCls}
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field label={cfg.stateLabel} required error={errors["state"]}>
                {cfg.states.length > 0 ? (
                  <select
                    className={inputCls}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {cfg.states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputCls}
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  />
                )}
              </Field>
              <Field label={cfg.zipLabel} required error={errors["zip"]}>
                <input
                  className={inputCls}
                  autoComplete="postal-code"
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                />
              </Field>
              <Field label="Phone" required hint={`Format: ${cfg.phoneCode} ${cfg.phonePlaceholder}`} error={errors["phone"]}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary px-3 text-sm font-semibold">
                    {cfg.phoneCode}
                  </span>
                  <input
                    className={inputCls}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={cfg.phonePlaceholder}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
              </Field>
            </div>
          </Card>

          {/* Delivery method */}
          <Card title="Delivery method" step={3}>
            <div className="grid gap-3">
              {(["standard", "express"] as const).map((id) => {
                const m = id === "express" ? cfg.express : cfg.standard;
                const price = freeOver && netSubtotal >= freeOver && id === "standard" ? 0 : m.cost;
                const Icon = id === "express" ? Zap : Truck;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setShip(id)}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                      ship === id
                        ? "border-sale bg-sale/5 ring-1 ring-sale/20"
                        : "border-border hover:border-sale/60 hover:bg-secondary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                        ship === id ? "bg-sale text-primary-foreground" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {id === "express" ? "Express Delivery" : "Standard Delivery"}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        Estimated {etaLabel(m.etaMin, m.etaMax)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">{price === 0 ? "Free" : money(price)}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Payment */}
          <Card title="Payment" step={4}>
            <p className="-mt-2 mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> All transactions are encrypted and secure.
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {cfg.payments.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayment(p)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-all",
                    payment === p
                      ? "border-sale bg-sale/5 ring-1 ring-sale/20"
                      : "border-border hover:border-sale/60",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {p === "card" && <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{PAYMENT_LABELS[p] ?? p}</span>
                  </span>
                  <span
                    className={cn(
                      "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border-2",
                      payment === p ? "border-sale bg-sale" : "border-border",
                    )}
                  >
                    {payment === p && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                  </span>
                </button>
              ))}
            </div>

            {payment === "card" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Card number" required error={errors["cardNumber"]} className="sm:col-span-2">
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={form.cardNumber}
                    onChange={(e) =>
                      set(
                        "cardNumber",
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 16)
                          .replace(/(.{4})/g, "$1 ")
                          .trim(),
                      )
                    }
                  />
                </Field>
                <Field label="Expiry (MM/YY)" required error={errors["expiry"]}>
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={form.expiry}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      set("expiry", d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }}
                  />
                </Field>
                <Field label="CVV" required error={errors["cvv"]}>
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={form.cvv}
                    onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </Field>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground sm:col-span-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[hsl(var(--sale))]"
                    checked={billingSame}
                    onChange={(e) => setBillingSame(e.target.checked)}
                  />
                  Billing address is the same as delivery address
                </label>
                {!billingSame && (
                  <Field label="Billing address" required error={errors["billingAddress"]} className="sm:col-span-2">
                    <textarea
                      className="min-h-20 w-full min-w-0 rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-sale"
                      value={form.billingAddress}
                      onChange={(e) => set("billingAddress", e.target.value)}
                    />
                  </Field>
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-secondary p-3 text-[11px] leading-relaxed text-muted-foreground">
                You will be redirected to {PAYMENT_LABELS[payment]} to complete your payment of{" "}
                <span className="font-semibold text-foreground">{money(total)}</span> securely.
              </p>
            )}
          </Card>
        </div>

        {/* Summary */}
        <aside className="rounded-2xl border border-border bg-card p-4 card-elevated sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold tracking-tight">Your Order</h2>
          <ul className="mt-5 grid gap-4 border-b border-border pb-5">
            {items.map((i, idx) => (
              <li key={`${i.id}-${idx}`} className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3">
                <img
                  src={i.image}
                  alt={i.name}
                  width={112}
                  height={112}
                  loading="lazy"
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {i.name} <span className="text-muted-foreground">× {i.qty}</span>
                  </p>
                  {(i.size || i.color) && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[i.size, i.color].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        aria-label={`Decrease ${i.name}`}
                        onClick={() => setQty(`${i.id}|${i.size ?? ""}|${i.color ?? ""}`, i.qty - 1)}
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{i.qty}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${i.name}`}
                        onClick={() => setQty(`${i.id}|${i.size ?? ""}|${i.color ?? ""}`, i.qty + 1)}
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(`${i.id}|${i.size ?? ""}|${i.color ?? ""}`)}
                      className="text-[11px] font-semibold text-muted-foreground hover:text-sale"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold">{money(conv(i.price * i.qty))}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 grid gap-2.5 text-sm">
            <Row label={`Subtotal (${count} items)`} value={money(conv(subtotal))} />
            {discount > 0 && (
              <Row label={`Promo (${applied?.code.toUpperCase()})`} value={`−${money(conv(discount))}`} accent />
            )}
            <Row label="Shipping" value={shipping === 0 ? "Free" : money(shipping)} />
            <Row label={cfg.taxLabel} value={money(tax)} />
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-3 text-lg">
              <dt className="font-extrabold">Total</dt>
              <dd className="font-extrabold">{money(total)}</dd>
            </div>
          </dl>

          {errors["cart"] && (
            <p className="mt-4 rounded-lg bg-sale/10 px-3 py-2 text-xs font-medium text-sale">{errors["cart"]}</p>
          )}

          <button
            type="button"
            onClick={placeOrder}
            disabled={placing}
            className="mt-5 hidden h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-forest text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70 lg:flex"
          >
            {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Pay {money(total)}
          </button>

          <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
            {[
              { icon: Lock, text: "Secure Payment" },
              { icon: ShieldCheck, text: "Your data is protected" },
              { icon: RotateCcw, text: "Easy Returns" },
              { icon: Package, text: "Reliable Delivery" },
            ].map((f) => (
              <li key={f.text} className="flex min-w-0 items-center gap-2">
                <f.icon className="h-4 w-4 shrink-0 text-brand-forest" />
                <span className="min-w-0 text-[11px] leading-tight text-muted-foreground">{f.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Mobile pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={placeOrder}
          disabled={placing}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-forest text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Pay {money(total)}
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-forest" /> Secure checkout · Your information is protected
        </p>
      </div>
    </Shell>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold", accent && "text-brand-forest")}>{value}</dd>
    </div>
  );
}

function Card({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 card-elevated sm:p-5">
      <h2 className="mb-4 flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-0">
      <header className="border-b border-border bg-background">
        <div className="shop-container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            Faiza<span className="text-sale">Zone</span>
          </Link>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-sm font-bold">
              <Lock className="h-4 w-4 text-brand-forest" /> Secure Checkout
            </p>
            <p className="text-[11px] text-muted-foreground">Your information is protected</p>
          </div>
        </div>
      </header>
      <main className="shop-container py-5 sm:py-8">
        <h1 className="sr-only">Secure Checkout</h1>
        {children}
      </main>
    </div>
  );
}
