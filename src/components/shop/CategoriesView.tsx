"use client";

import { useMemo, useState, Suspense } from "react";
import { Link } from "@/components/ui/link";
import { useSearchParams } from "next/navigation";
import { PackageOpen, SlidersHorizontal, X } from "lucide-react";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Sections";
import { ProductGrid } from "@/components/shop/ProductCard";
import { BottomNav } from "@/components/shop/BottomNav";
import { categories } from "@/components/shop/data";
import { matchesCategory, useShopProducts } from "@/lib/catalog";
import { useMarketPrefix } from "@/lib/market-link";

const sorts = ["Newest", "Popular", "Price: Low", "Price: High"] as const;
const tabs = ["All", ...categories.map((c) => c.name)];

function CategoriesViewInner({ initialCategory }: { initialCategory?: string }) {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") ?? initialCategory;

  const searchCategory = categories.some((item) => item.name === categoryParam)
    ? categoryParam!
    : "All";
  const [active, setActive] = useState(searchCategory);
  const [lastSearch, setLastSearch] = useState(searchCategory);
  if (lastSearch !== searchCategory) {
    setLastSearch(searchCategory);
    setActive(searchCategory);
  }
  const [sort, setSort] = useState<(typeof sorts)[number]>("Newest");
  const [onlyFlash, setOnlyFlash] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const market = useMarketPrefix();
  const { data, isLoading } = useShopProducts(market);

  const products = useMemo(() => {
    let list = [...(data ?? [])];
    if (active !== "All") list = list.filter((p) => matchesCategory(p, active));
    if (onlyFlash) list = list.filter((p) => p.flash);
    if (sort === "Popular") list.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    if (sort === "Price: Low") list.sort((a, b) => a.price - b.price);
    if (sort === "Price: High") list.sort((a, b) => b.price - a.price);
    return list;
  }, [data, active, onlyFlash, sort]);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Categories
        </h2>
        <ul className="mt-3 space-y-1">
          {tabs.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => setActive(name)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  active === name
                    ? "bg-sale/10 font-semibold text-sale"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyFlash}
          onChange={(e) => setOnlyFlash(e.target.checked)}
          className="h-4 w-4 accent-[var(--sale)]"
        />
        Flash sale only
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-0">
      <Header />

      <main className="shop-container py-5 sm:py-8">
        <nav aria-label="Breadcrumb" className="sr-only">
          <Link to="/">Home</Link> / Categories
        </nav>
        <h1 className="sr-only">{active === "All" ? "All Categories" : active}</h1>

        {/* Mobile / tablet active category heading */}
        <section className="mb-4 lg:hidden">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {active === "All" ? "All Products" : `${active}'s Collection`}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{products.length} products</p>
        </section>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sort by:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
              className="rounded-md border border-border bg-background px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground"
            >
              {sorts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-sale"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        <section className="mt-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-lg bg-card card-elevated">
                  <div className="aspect-square animate-pulse bg-muted" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-border p-10 text-center">
              <div>
                <PackageOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">No products match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActive("All");
                    setOnlyFlash(false);
                  }}
                  className="mt-4 rounded-full bg-sale px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {filtersOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background p-5 sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-80 sm:rounded-none">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Filters</h2>
              <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-6 w-full rounded-full bg-sale py-3 text-sm font-semibold text-primary-foreground"
            >
              Show {products.length} products
            </button>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}

export function CategoriesView({ category }: { category?: string | undefined }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="shop-container py-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </main>
        </div>
      }
    >
      <CategoriesViewInner initialCategory={category} />
    </Suspense>
  );
}
