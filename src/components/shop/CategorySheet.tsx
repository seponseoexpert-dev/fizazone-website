"use client";

import {
  Baby,
  ChevronRight,
  Heart,
  LayoutGrid,
  Minus,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { Link } from "@/components/ui/link";
import { categories } from "@/components/shop/data";

type CategoryMeta = {
  icon: React.ElementType;
  subtitle: string;
  bg: string;
  fg: string;
};

export const categoryMeta: Record<string, CategoryMeta> = {
  Men: { icon: User, subtitle: "T-Shirts, Polos, Hoodies & more", bg: "var(--cat-men-bg)", fg: "var(--cat-men-fg)" },
  Women: { icon: Heart, subtitle: "Kurti, Tops, T-Shirts & more", bg: "var(--cat-women-bg)", fg: "var(--cat-women-fg)" },
  Kurti: { icon: Sparkles, subtitle: "Printed, Embroidered & more", bg: "var(--cat-kurti-bg)", fg: "var(--cat-kurti-fg)" },
  Panjabi: { icon: Shirt, subtitle: "Cotton, Silk & Festive", bg: "var(--cat-panjabi-bg)", fg: "var(--cat-panjabi-fg)" },
  Boys: { icon: Baby, subtitle: "Boys & Girls Clothing", bg: "var(--cat-boys-bg)", fg: "var(--cat-boys-fg)" },
  "T-shirt": { icon: Shirt, subtitle: "Graphic, Solid & more", bg: "var(--cat-tshirt-bg)", fg: "var(--cat-tshirt-fg)" },
  Pants: { icon: Minus, subtitle: "Jeans, Chinos & Joggers", bg: "var(--cat-pants-bg)", fg: "var(--cat-pants-fg)" },
  Bags: { icon: ShoppingBag, subtitle: "Backpacks, Totes & more", bg: "var(--cat-bags-bg)", fg: "var(--cat-bags-fg)" },
};

export function CategorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Shop by Category">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-4 pb-8 shadow-[0_-8px_30px_-12px_rgb(0,0,0,0.25)]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Shop by Category</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close categories"
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">All Categories</p>

        <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
          {categories.map((cat) => {
            const meta = categoryMeta[cat.name]!;
            const Icon = meta.icon;
            return (
              <Link
                key={cat.name}
                to="/categories"
                search={{ category: cat.name }}
                onClick={onClose}
                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/30 active:bg-secondary/50"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: meta.bg, color: meta.fg }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-foreground">{cat.name}&apos;s Collection</p>
                  <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}

          <Link
            to="/categories"
            search={{ category: "All" }}
            onClick={onClose}
            className="flex items-center gap-4 bg-accent/5 px-4 py-3.5 transition-colors hover:bg-accent/10"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <LayoutGrid className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-accent">View All Products</p>
              <p className="truncate text-xs text-muted-foreground">Browse entire catalog</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-accent" />
          </Link>
        </div>
      </div>
    </div>
  );
}
