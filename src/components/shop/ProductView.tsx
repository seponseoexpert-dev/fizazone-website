"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/ui/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Minus, Plus, RotateCcw, ShieldCheck, Share2, ShoppingCart, Star, Truck } from "lucide-react";
import { Header } from "@/components/shop/Header";
import { Footer, SectionHeader } from "@/components/shop/Sections";
import { ProductGrid } from "@/components/shop/ProductCard";
import { useCart } from "@/components/shop/cart";
import { type ShopProduct } from "@/lib/catalog";
import { RichText } from "@/lib/rich-text";
import { useMarketPrefix } from "@/lib/market-link";
import { useCountry } from "@/lib/country";

/** Shared product detail UI, rendered by the market route /$market/product/$id. */
export function ProductView({
  product,
  related,
}: {
  product: ShopProduct;
  related: ShopProduct[];
}) {
  const sizes = product.sizes.length ? product.sizes : ["Free"];
  const colors = product.colorNames.length ? product.colorNames : ["Default"];
  const [size, setSize] = useState(sizes[0]!);
  const [color, setColor] = useState(colors[0]!);
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const { add, count } = useCart();
  const { format } = useCountry();
  const router = useRouter();
  const market = useMarketPrefix();

  const addToCart = () =>
    add(
      {
        id: product.id,
        ...(product.slug ? { slug: product.slug } : {}),
        name: product.name,
        image: product.image,
        price: product.price,
        size,
        color,
      },
      qty,
    );


  const gallery = useMemo(() => product.images, [product]);


  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-border bg-background px-3 py-3 lg:hidden">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{product.name}</h2>
        <Link to="/cart" aria-label="Cart" className="relative grid h-9 w-9 shrink-0 place-items-center">
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </header>

      <main className="shop-container py-5 sm:py-8">
        <nav aria-label="Breadcrumb" className="hidden text-xs text-muted-foreground lg:block">
          <Link to="/$market" params={{ market }} className="hover:text-sale">Home</Link>
          <span className="px-1.5">/</span>
          <Link to="/$market/categories" params={{ market }} search={{ category: undefined }} className="hover:text-sale">Categories</Link>

          <span className="px-1.5">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-0 grid gap-6 lg:mt-4 lg:grid-cols-2 lg:gap-10">
          {/* Gallery */}
          <div className="grid gap-3 lg:grid-cols-[72px_minmax(0,1fr)] lg:items-start">
            <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setShot(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted transition-colors lg:h-[72px] lg:w-[72px] ${
                    shot === i ? "border-brand-green" : "border-border"
                  }`}
                >
                  <img
                    src={src}
                    alt={product.imageAlts?.[i] || `${product.name} — image ${i + 1}`}
                    width={200}
                    height={200}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="relative order-1 aspect-square w-full overflow-hidden rounded-xl bg-muted lg:order-2 lg:rounded-2xl">
              <img
                src={gallery[shot] ?? product.image}
                alt={product.imageAlts?.[shot] || product.name}
                width={900}
                height={900}
                className="h-full w-full object-cover"
              />
              {discount > 0 && (
                <span className="absolute left-3 top-3 rounded-full bg-sale px-3 py-1 text-[11px] font-bold text-primary-foreground">
                  -{discount}%
                </span>
              )}
              <span className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {shot + 1} / {gallery.length}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0">
            {product.category && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {product.category}
              </p>
            )}
            <h1 className="mt-2 text-lg font-semibold leading-snug sm:text-2xl md:text-3xl">{product.name}</h1>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold">{product.rating}</span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={i < product.rating ? "h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" : "h-3.5 w-3.5 text-border"}
                  />
                ))}
              </span>
              <span className="text-xs text-sale">{product.reviews ?? 24} Reviews</span>

              <span className="ml-auto flex items-center gap-3 text-muted-foreground">
                <button type="button" aria-label="Add to wishlist" className="transition-colors hover:text-sale">
                  <Heart className="h-5 w-5" />
                </button>
                <button type="button" aria-label="Share product" className="transition-colors hover:text-sale">
                  <Share2 className="h-5 w-5" />
                </button>
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold text-brand-green sm:text-3xl">{format(product.price)}</span>
              {product.oldPrice && (
                <span className="text-sm text-muted-foreground line-through">{format(product.oldPrice)}</span>
              )}
            </div>

            {/* Color */}
            <div className="mt-4">
              <h2 className="text-sm text-muted-foreground">
                Color: <span className="font-semibold text-foreground">{color}</span>
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-9 rounded-md border px-4 text-sm font-medium transition-colors ${
                      color === c
                        ? "border-brand-green bg-brand-green text-white"
                        : "border-border text-foreground hover:border-brand-green/60"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-4">
              <h2 className="text-sm text-muted-foreground">
                Size: <span className="font-semibold text-foreground underline">{size}</span>
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`h-9 min-w-10 rounded-md border px-3 text-sm font-medium transition-colors ${
                      size === s
                        ? "border-brand-green bg-brand-green text-white"
                        : "border-border text-foreground hover:border-brand-green/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + actions */}
            <div className="mt-5 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
              <div className="flex w-fit items-center rounded-full border border-border">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-brand-green"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-brand-green"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="hidden gap-3 lg:grid lg:grid-cols-2">
                <button
                  type="button"
                  onClick={addToCart}
                  className="h-11 rounded-md border border-brand-green bg-brand-green/10 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-green/20"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={addToCart}
                  className="h-11 rounded-md bg-brand-green text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Buy Now
                </button>
              </div>
            </div>

            {/* Assurances */}
            <ul className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
              {[
                { icon: Truck, text: `Free delivery over ${format(2000)}` },
                { icon: RotateCcw, text: "7-day easy return" },
                { icon: ShieldCheck, text: "Secure payment" },
              ].map((f) => (
                <li key={f.text} className="flex min-w-0 items-center gap-2">
                  <f.icon className="h-4 w-4 shrink-0 text-brand-green" />
                  <span className="min-w-0 text-xs text-muted-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Description */}
        <section className="mt-10 grid gap-6 border-t border-border pt-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <h2 className="text-base font-bold">Product Details</h2>
            <RichText
              className="mt-2 text-sm text-muted-foreground"
              value={product.description}
              fallback="Cut from soft, durable fabric with reinforced seams, this piece is designed for daily wear. Machine washable, colour-fast and finished with a comfortable regular fit."
            />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {[
              ["Category", product.category ?? "Fashion"],
              ["Material", "Cotton blend"],
              ["Fit", "Regular"],
              ["Availability", product.stock > 0 ? `${product.stock} in stock` : "Out of stock"],
              ["SKU", product.slug.toUpperCase()],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <SectionHeader title="You may also like" />
            <ProductGrid products={related} />
          </section>
        )}
      </main>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-3 border-t border-border bg-background px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={addToCart}
          className="h-11 rounded-md border border-brand-green bg-brand-green/10 text-sm font-semibold text-brand-green"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={addToCart}
          className="h-11 rounded-md bg-brand-green text-sm font-semibold text-white"
        >
          Buy Now
        </button>
      </div>

      <Footer />
      <div className="hidden lg:block">
        </div>
    </div>
  );
}
