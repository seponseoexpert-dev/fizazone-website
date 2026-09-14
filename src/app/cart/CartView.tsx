"use client";

import { useState } from "react";
import { Link } from "@/components/ui/link";
import { ChevronUp, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Header } from "@/components/shop/Header";
import { lineKey, useCart } from "@/components/shop/cart";
import { useCoupon } from "@/components/shop/useCoupon";
import { productLinkProps, useMarketPrefix } from "@/lib/market-link";
import { useCountry } from "@/lib/country";
import { cn } from "@/lib/utils";

const SHIPPING = 100;
const FREE_OVER = 5000;

export function CartView() {
  const { items, subtotal, count, setQty, remove } = useCart();
  const { country, convert } = useCountry();
  const tk = (n: number) => {
    const v = convert(n);
    const d = country.rate === 1 ? 0 : 2;
    return `${country.symbol}${v.toLocaleString("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })}`;
  };
  const market = useMarketPrefix();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const { applied, error: promoError, loading: promoLoading, apply, clearCoupon, discount } =
    useCoupon(subtotal);

  const shipping = items.length === 0 || subtotal >= FREE_OVER ? 0 : SHIPPING;
  const savings = items.reduce(
    (n, i) => n + (i.mrp && i.mrp > i.price ? (i.mrp - i.price) * i.qty : 0),
    0,
  );
  const total = Math.max(0, subtotal - discount) + shipping;
  const remaining = Math.max(0, FREE_OVER - subtotal);
  const progress = Math.min(100, (subtotal / FREE_OVER) * 100);

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-16">
      <Header />

      <main className="shop-container py-5 sm:py-8">
        <h1 className="sr-only">Your Cart</h1>

        {items.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-base font-bold">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the collection and add something you love.
            </p>
            <Link
              to="/categories"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-sale px-6 text-sm font-semibold text-primary-foreground"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <p className="text-xs font-semibold sm:text-sm">
                {remaining === 0 ? (
                  <span className="text-brand-forest">🎉 You unlocked FREE delivery!</span>
                ) : (
                  <>
                    Add <span className="text-sale">{tk(remaining)}</span> more for FREE delivery
                  </>
                )}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand-forest transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>

            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
              {/* Line items */}
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {items.map((item) => {
                  const key = lineKey(item);
                  return (
                    <li
                      key={key}
                      className="grid grid-cols-[28px_64px_minmax(0,1fr)] items-center gap-3 p-3 sm:grid-cols-[40px_80px_minmax(0,1fr)] sm:gap-4 sm:p-4"
                    >
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(key)}
                        className="grid h-8 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-sale sm:w-10"
                      >
                        <Trash2 className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                      </button>

                      <Link
                        {...productLinkProps(market, item)}
                        className="aspect-square w-16 overflow-hidden rounded-xl bg-muted sm:w-20"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          width={240}
                          height={240}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                        <div className="min-w-0">
                          <Link
                            {...productLinkProps(market, item)}
                            className="line-clamp-2 text-sm font-bold leading-snug hover:text-sale sm:text-base"
                          >
                            {item.name}
                          </Link>
                          {(item.size || item.color) && (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                              {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
                                .filter(Boolean)
                                .join("  •  ")}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                            Price: {tk(item.price)}
                          </p>
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-1 sm:justify-items-end sm:gap-2">
                          <p className="min-w-0 truncate text-base font-extrabold text-sale sm:text-lg">
                            {tk(item.price * item.qty)}
                          </p>
                          <div className="flex shrink-0 items-center rounded-lg border border-border">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setQty(key, item.qty - 1)}
                              className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-sale"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setQty(key, item.qty + 1)}
                              className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-sale"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Summary column */}
              <aside className="grid gap-4 lg:sticky lg:top-24">
                {/* Promo */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold">Have a promo code?</p>
                    <button
                      type="button"
                      onClick={() => setPromoOpen((v) => !v)}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold uppercase tracking-wide transition-colors hover:border-sale hover:text-sale"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                  {applied && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-brand-mist px-3 py-2">
                      <p className="min-w-0 truncate text-xs font-semibold text-brand-forest">
                        {applied.code.toUpperCase()} applied · −{tk(discount)}
                      </p>
                      <button
                        type="button"
                        onClick={clearCoupon}
                        className="shrink-0 text-[11px] font-bold uppercase text-muted-foreground hover:text-sale"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {promoOpen && (
                    <>
                      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                        <input
                          value={promo}
                          onChange={(e) => setPromo(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void apply(promo);
                          }}
                          placeholder="Enter code"
                          className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
                        />
                        <button
                          type="button"
                          disabled={promoLoading}
                          onClick={() => void apply(promo)}
                          className="h-10 shrink-0 rounded-lg bg-secondary px-4 text-xs font-bold uppercase disabled:opacity-60"
                        >
                          {promoLoading ? "..." : "Apply"}
                        </button>
                      </div>
                      {promoError && <p className="mt-2 text-xs font-medium text-sale">{promoError}</p>}
                    </>
                  )}
                </div>

                {/* Totals */}
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <dl className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="font-semibold">{tk(subtotal)}</dd>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">You save</dt>
                        <dd className="font-semibold text-brand-forest">−{tk(savings)}</dd>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Promo ({applied?.code.toUpperCase()})</dt>
                        <dd className="font-semibold text-brand-forest">−{tk(discount)}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Delivery Charge</dt>
                      <dd className="font-semibold">{tk(shipping)}</dd>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 border-t border-border pt-3">
                      <dt className="text-base font-bold">Total</dt>
                      <dd className="text-xl font-extrabold sm:text-2xl">{tk(total)}</dd>
                    </div>
                  </dl>
                </div>

                <Link
                  to="/checkout"
                  className="hidden h-14 w-full items-center justify-center rounded-2xl bg-brand-forest text-base font-bold text-primary-foreground transition-transform hover:scale-[1.01] lg:flex"
                >
                  Checkout • {tk(total)}
                </Link>
              </aside>
            </div>
          </>
        )}
      </main>

      {/* Mobile / tablet sticky bar */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          {showBreakdown && (
            <dl className="mb-3 grid gap-2 rounded-xl bg-brand-mist p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal ({count} items)</dt>
                <dd className="font-semibold">{tk(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Promo ({applied?.code.toUpperCase()})</dt>
                  <dd className="font-semibold text-brand-forest">−{tk(discount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Delivery Charge</dt>
                <dd className="font-semibold">{tk(shipping)}</dd>
              </div>
              {remaining > 0 && (
                <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <dt>Free delivery over {tk(FREE_OVER)}</dt>
                  <dd>Add {tk(remaining)} more</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <dt className="font-bold">Total</dt>
                <dd className="font-extrabold text-brand-forest">{tk(total)}</dd>
              </div>
            </dl>
          )}
          <div className="grid grid-cols-[minmax(0,1fr)_1.3fr] items-stretch gap-3">
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              aria-expanded={showBreakdown}
              className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-brand-mist px-3 py-2 text-left"
            >
              <span className="min-w-0">
                <span className="block text-[11px] text-muted-foreground">Total</span>
                <span className="block truncate text-lg font-extrabold text-brand-forest">{tk(total)}</span>
              </span>
              <ChevronUp
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  showBreakdown && "rotate-180",
                )}
              />
            </button>
            <Link
              to="/checkout"
              className="flex items-center justify-center rounded-xl bg-brand-forest px-4 text-sm font-bold uppercase tracking-[0.06em] text-primary-foreground"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
