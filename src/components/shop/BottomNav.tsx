"use client";

import { useState } from "react";
import { Heart, Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { Link } from "@/components/ui/link";
import { usePathname } from "next/navigation";
import { CategorySheet } from "@/components/shop/CategorySheet";
import { useCart } from "@/components/shop/cart";

const rightItems = [
  { label: "Wishlist", icon: Heart, to: "/wishlist" },
  { label: "Account", icon: User, to: "/account" },
] as const;

const centerItem = { label: "Cart", icon: ShoppingCart, to: "/cart" } as const;

export function BottomNav() {
  const pathname = usePathname() || "/";
  const [catOpen, setCatOpen] = useState(false);
  const { count } = useCart();

  return (
    <>
      <CategorySheet open={catOpen} onClose={() => setCatOpen(false)} />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-safe backdrop-blur-md lg:hidden"
      >
        <div className="grid grid-cols-5 items-end px-1 pb-1 pt-1">
          <NavItem label="Home" icon={Home} to="/" pathname={pathname} />

          <button
            type="button"
            onClick={() => setCatOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={catOpen}
            className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
              catOpen || pathname.startsWith("/categories") ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <LayoutGrid
              className="h-[22px] w-[22px]"
              strokeWidth={catOpen ? 2.25 : 1.75}
              fill={catOpen ? "currentColor" : "none"}
            />
            Categories
          </button>

          <div className="flex flex-col items-center justify-end gap-1 pb-0.5">
            <Link
              to={centerItem.to}
              aria-label={centerItem.label}
              className="relative -mt-5 grid h-13 w-13 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_6px_16px_-4px_oklch(0.55_0.2_262/0.45)] ring-4 ring-background transition-transform active:scale-95"
            >
              <centerItem.icon className="h-6 w-6" strokeWidth={2} />
              {count > 0 && (
                <span
                  aria-label={`${count} items in cart`}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-background"
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
            <span
              className={`text-[10px] font-medium ${
                pathname.startsWith(centerItem.to) ? "text-accent" : "text-muted-foreground"
              }`}
            >
              {centerItem.label}
            </span>
          </div>

          {rightItems.map((item) => (
            <NavItem key={item.label} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </>
  );
}

function NavItem({
  label,
  icon: Icon,
  to,
  pathname,
}: {
  label: string;
  icon: typeof Home;
  to: string;
  pathname: string;
}) {
  const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition-colors ${
        isActive ? "text-accent" : "text-muted-foreground"
      }`}
    >
      <Icon
        className="h-[22px] w-[22px]"
        strokeWidth={isActive ? 2.25 : 1.75}
        fill={isActive ? "currentColor" : "none"}
      />
      {label}
    </Link>
  );
}
