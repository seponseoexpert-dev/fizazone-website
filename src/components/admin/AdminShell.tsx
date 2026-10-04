"use client";

import { useState, type ReactNode } from "react";
import { Link } from "@/components/ui/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Boxes,
  ChevronDown,
  ClipboardList,
  Globe,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Menu,
  Package,
  RotateCcw,
  Settings,
  Star,
  Store,
  Truck,
  User,
  UserCog,
  X,
} from "lucide-react";

import { AdminAccountDialog } from "@/components/admin/AdminAccountDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminAuth } from "@/hooks/useAdminAuth";



type NavItem = { label: string; icon: typeof Package; to?: string };
type NavGroup = { label?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { items: [{ label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard" }] },
  {
    label: "Product & Stock",
    items: [
      { label: "Products", icon: Package, to: "/admin/products" },
      { label: "Stock", icon: Boxes, to: "/admin/stock" },
      { label: "Reviews", icon: Star, to: "/admin/reviews" },
    ],
  },
  {
    label: "POS & Orders",
    items: [
      { label: "POS", icon: Store, to: "/admin/pos" },
      { label: "POS Orders", icon: ClipboardList, to: "/admin/pos-orders" },
      { label: "Online Orders", icon: Truck, to: "/admin/online-orders" },
      { label: "Return Orders", icon: RotateCcw, to: "/admin/return-orders" },
      { label: "Bulk Orders", icon: ClipboardList, to: "/admin/bulk-orders" },
      { label: "Return And Refunds", icon: RotateCcw, to: "/admin/refunds" },

    ],
  },
  {
    label: "Country & Localization",
    items: [
      { label: "Countries", icon: Globe, to: "/admin/countries" },
      { label: "Categories", icon: Layers, to: "/admin/categories" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Homepage Banners", icon: ImageIcon, to: "/admin/banners" },
      { label: "Homepage Sections", icon: LayoutDashboard, to: "/admin/homepage" },
    ],
  },
  {
    label: "Promo",
    items: [
      { label: "Coupons", icon: BadgePercent, to: "/admin/coupons" },
      { label: "Promotions", icon: Megaphone, to: "/admin/promotions" },
      { label: "Product Sections", icon: Boxes, to: "/admin/product-sections" },
    ],
  },
  {
    label: "Users & Roles",
    items: [{ label: "Admin Users", icon: UserCog, to: "/admin/users" }],
  },
  {
    label: "Setup",
    items: [{ label: "Settings", icon: Settings, to: "/admin/settings" }],
  },

];


function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || "";

  return (
    <nav className="space-y-5 px-3 pb-10">
      {NAV.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </p>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = item.to ? pathname === item.to : false;
              const content = (
                <>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </>
              );
              const cls = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-sale/10 text-sale"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground"
              }`;
              return (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className={cls} onClick={onNavigate}>
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`${cls} w-full cursor-not-allowed opacity-60`}
                      title="Coming soon"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  children,
  userName,
  requireAuth = true,
}: {
  children: ReactNode;
  userName?: string;
  requireAuth?: boolean;
}) {
  const { userName: authUserName, allowed, loading } = useAdminAuth({
    redirectToLogin: requireAuth,
  });
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const displayName = userName || authUserName || "Admin";

  if (requireAuth) {
    if (loading) {
      return (
        <div className="grid min-h-screen place-items-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Faiza<span className="text-sale">Admin</span>
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-sale" />
              <span>Verifying access…</span>
            </div>
          </div>
        </div>
      );
    }

    if (allowed === false) {
      return (
        <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
          <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h1 className="font-display text-2xl font-bold text-foreground">Admin access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This area is restricted to store administrators.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/admin/login"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-sale px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-sale/90"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background lg:flex">
        <Link to="/" className="flex h-16 items-center gap-2 px-5">
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Faiza<span className="text-sale">Admin</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background shadow-xl">
            <div className="flex h-16 items-center justify-between px-5">
              <span className="font-display text-lg font-extrabold text-foreground">
                Faiza<span className="text-sale">Admin</span>
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="min-w-0 overflow-x-hidden lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg border border-border p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-muted-foreground lg:block">Admin Panel</div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline">
              English
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 transition-colors hover:bg-secondary focus:outline-none"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-green/20 text-xs font-bold text-brand-forest">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden text-left leading-tight sm:block">
                    <p className="text-[11px] text-muted-foreground">Hello</p>
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setAccountOpen(true)}>
                  <User className="h-4 w-4" />
                  My Account
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/logout">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 max-w-full p-4 sm:p-6">{children}</main>
      </div>

      <AdminAccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
    </div>
  );
}
