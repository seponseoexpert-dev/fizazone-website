"use client";

import { useState } from "react";
import { Link } from "@/components/ui/link";
import { useRouter } from "next/navigation";
import { productLinkProps, useMarketPrefix } from "@/lib/market-link";
import { useCart } from "@/components/shop/cart";
import { BulkOrderDialog } from "@/components/shop/BulkOrderDialog";
import { ArrowRight, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Product } from "./data";

const DEFAULT_SIZES = ["S", "M", "L", "XL"];

export function QuickView({
  product,
  open,
  onOpenChange,
}: {
  product: Product & { sizes?: string[]; stock?: number };
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const SIZES = product.sizes?.length ? product.sizes : DEFAULT_SIZES;
  const [size, setSize] = useState(SIZES[0]!);
  const [qty, setQty] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { add } = useCart();
  const market = useMarketPrefix();
  const router = useRouter();

  const addToCart = () => {
    add({ id: product.id, ...(product.slug ? { slug: product.slug } : {}), name: product.name, image: product.image, price: product.price, size }, qty);
    onOpenChange(false);
  };

  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const openBulk = () => {
    onOpenChange(false);
    setBulkOpen(true);
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] w-[calc(100%-1.5rem)] max-w-md gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl lg:max-w-4xl">
        <div className="max-h-[92svh] overflow-y-auto overscroll-contain">
          <div className="grid gap-5 p-4 sm:p-6 md:grid-cols-2 md:gap-8">
            <div className="md:sticky md:top-0">
              <div className="h-[34svh] w-full overflow-hidden rounded-xl bg-muted md:aspect-square md:h-auto">
                <img
                  src={product.image}
                  alt={product.name}
                  width={800}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="min-w-0 pb-24 md:pb-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {product.category ?? "Faiza Zone"}
              </p>
              <DialogTitle className="mt-2 pr-8 text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl">
                {product.name}
              </DialogTitle>

              <p className="mt-3 text-2xl font-extrabold text-brand-forest">Tk {product.price.toFixed(2)}</p>
              <DialogDescription className="mt-1 text-xs">
                <span className="underline underline-offset-2">Shipping</span> calculated at checkout.
              </DialogDescription>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Size</p>
                  {typeof product.stock === "number" && product.stock > 0 && product.stock <= 10 && (
                    <span className="rounded-full bg-sale/10 px-2 py-0.5 text-[11px] font-semibold text-sale">
                      Only {product.stock} left
                    </span>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-4">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                        size === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold">Quantity</p>
                <div className="mt-2 inline-flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 hidden gap-3 md:grid">
                <button
                  type="button"
                  onClick={addToCart}
                  className="h-12 rounded-lg border border-foreground text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  className="h-12 rounded-lg bg-sale text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Buy it now
                </button>
                <button
                  type="button"
                  onClick={openBulk}
                  className="h-12 rounded-lg bg-foreground text-sm font-bold text-background transition-opacity hover:opacity-90"
                >
                  Customize &amp; Order in bulk
                </button>
              </div>

              <Link
                {...productLinkProps(market, product)}
                className="mt-5 inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:text-sale"
              >
                View full details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Mobile sticky actions */}
          <div className="sticky bottom-0 z-10 grid gap-2 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={addToCart}
                className="h-12 rounded-lg border border-foreground text-sm font-semibold"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={buyNow}
                className="h-12 rounded-lg bg-sale text-sm font-semibold text-primary-foreground"
              >
                Buy it now
              </button>
            </div>
            <button
              type="button"
              onClick={openBulk}
              className="h-11 rounded-lg bg-foreground text-sm font-bold text-background"
            >
              Customize &amp; Order in bulk
            </button>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      <BulkOrderDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        seed={{
          ...(/^[0-9a-f-]{36}$/i.test(String(product.id)) ? { productId: String(product.id) } : {}),
          productName: product.name,
          productLink: `${market}/product/${product.slug ?? product.id}`,
          size,
          qty: Math.max(qty, 10),
          countryCode: (market.replace("/", "") || "bd").toUpperCase(),
        }}
      />
    </>
  );
}
