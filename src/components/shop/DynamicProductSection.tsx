"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "@/components/ui/link";
import { ProductCard, type CardProduct } from "./ProductCard";
import type { ProductSectionLayout } from "@/lib/homepage-config";
import { useMarketPrefix, productLinkProps } from "@/lib/market-link";
import { useCountry } from "@/lib/country";

interface Props {
  title: string;
  actionText?: string;
  actionLink?: string;
  layout?: ProductSectionLayout;
  products: CardProduct[];
}

export function DynamicProductSection({
  title,
  actionText,
  actionLink = "/categories",
  layout = "grid_4",
  products,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const market = useMarketPrefix();
  const { format } = useCountry();

  if (!products || products.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="shop-container py-5 sm:py-8">
      {/* Header */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div>
          <h2 className="truncate text-lg font-bold sm:text-xl md:text-2xl text-foreground">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {actionText && (
            <Link
              to={actionLink}
              className="shrink-0 rounded-full bg-sale/10 px-3 py-1.5 text-xs font-semibold text-sale hover:bg-sale hover:text-white transition"
            >
              {actionText}
            </Link>
          )}

          {layout === "carousel" && (
            <div className="flex shrink-0 gap-1.5 ml-1">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scroll("left")}
                className="grid h-8 w-8 place-items-center rounded-full border border-sale/30 text-sale hover:bg-sale hover:text-white transition shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scroll("right")}
                className="grid h-8 w-8 place-items-center rounded-full border border-sale/30 text-sale hover:bg-sale hover:text-white transition shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render based on selected layout */}
      {layout === "carousel" && (
        <div
          ref={scrollRef}
          className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] lg:gap-4"
        >
          {products.map((p) => (
            <div
              key={p.id}
              className="w-[72%] shrink-0 snap-start sm:w-[46%] md:w-[31%] lg:w-[23.5%]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {layout === "grid_3" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {layout === "grid_4" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {layout === "featured" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Featured Large Card */}
          {products[0] && (
            <div className="lg:col-span-5">
              <div className="group relative h-full flex flex-col overflow-hidden rounded-xl border border-sale/30 bg-gradient-to-b from-card to-secondary/30 p-4 transition-shadow hover:shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sale px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    <Sparkles className="h-3 w-3" /> Featured Pick
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Special</span>
                </div>
                <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-auto lg:flex-1 overflow-hidden rounded-lg bg-muted">
                  <Link {...productLinkProps(market, products[0])}>
                    <img
                      src={products[0].image}
                      alt={products[0].name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                </div>
                <div className="mt-4 flex flex-col space-y-2">
                  <h3 className="font-display text-base font-bold sm:text-lg">
                    <Link {...productLinkProps(market, products[0])} className="hover:text-sale">
                      {products[0].name}
                    </Link>
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-sale">
                      {format(products[0].price)}
                    </span>
                    {products[0].oldPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {format(products[0].oldPrice)}
                      </span>
                    )}
                  </div>
                  <Link
                    {...productLinkProps(market, products[0])}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-sale px-4 text-xs font-semibold text-white transition hover:bg-sale/90"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Grid of other 4 items */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
            {products.slice(1, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {layout === "two_column" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {products.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-4 transition hover:border-sale hover:shadow-md"
            >
              <div className="relative aspect-square w-32 sm:w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Link {...productLinkProps(market, p)}>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover transition hover:scale-105"
                  />
                </Link>
              </div>
              <div className="flex flex-1 flex-col justify-between py-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {p.category || "Collection"}
                  </span>
                  <h3 className="mt-1 font-semibold text-sm sm:text-base line-clamp-2">
                    <Link {...productLinkProps(market, p)} className="hover:text-sale">
                      {p.name}
                    </Link>
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm sm:text-base font-bold text-sale">
                      {format(p.price)}
                    </span>
                    {p.oldPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {format(p.oldPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  {...productLinkProps(market, p)}
                  className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium hover:border-sale hover:bg-sale/5 hover:text-sale"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
