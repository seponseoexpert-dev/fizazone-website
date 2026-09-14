"use client";

import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { Link } from "@/components/ui/link";
import type { Product } from "./data";
import { QuickView } from "./QuickView";
import { useAccount } from "@/lib/account";
import { useCountry } from "@/lib/country";
import { productLinkProps, useMarketPrefix } from "@/lib/market-link";

export type CardProduct = Product & { sizes?: string[]; stock?: number; slug?: string };

export function ProductCard({ product }: { product: CardProduct }) {
  const [open, setOpen] = useState(false);
  const { inWishlist, toggleWishlist } = useAccount();
  const { format } = useCountry();
  const market = useMarketPrefix();
  const saved = inWishlist(product.id);
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link {...productLinkProps(market, product)} aria-label={product.name}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={700}
          height={700}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        </Link>
        {product.flash && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            Flash Sale
          </span>
        )}
        <button
          type="button"
          aria-label={`${saved ? "Remove" : "Add"} ${product.name} ${saved ? "from" : "to"} wishlist`}
          onClick={() =>
            toggleWishlist({
              id: product.id,
              ...(product.slug ? { slug: product.slug } : {}),
              name: product.name,
              image: product.image,
              price: product.price,
            })
          }
          className={`absolute right-2 top-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-background/90 transition-colors hover:text-sale ${
            saved ? "text-sale" : "text-muted-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? "fill-sale" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col space-y-1.5 p-3">
        <h3 className="truncate text-xs font-semibold sm:text-sm">
          <Link {...productLinkProps(market, product)} className="hover:text-sale">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < product.rating
                  ? "h-3 w-3 fill-brand-yellow text-brand-yellow"
                  : "h-3 w-3 text-border"
              }
            />
          ))}
          {product.reviews ? (
            <span className="ml-1 text-[10px] text-muted-foreground">
              {product.rating}.0 ({product.reviews})
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-bold text-sale sm:text-base">
            {format(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {format(product.oldPrice)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-auto w-full rounded-md border border-border py-2 text-[11px] font-medium transition-colors hover:border-foreground hover:bg-secondary sm:text-xs"
        >
          Choose options
        </button>
      </div>

      <QuickView product={product} open={open} onOpenChange={setOpen} />
    </article>
  );
}

export function ProductGrid({ products }: { products: CardProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}