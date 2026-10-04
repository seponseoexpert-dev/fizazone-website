"use client";

import { useParams } from "next/navigation";
import { Link } from "@/components/ui/link";
import { Home, LayoutDashboard, SearchX } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";

const PAGES = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Products", to: "/admin/products" },
  { label: "Stock", to: "/admin/stock" },
  { label: "Reviews", to: "/admin/reviews" },
  { label: "POS", to: "/admin/pos" },
  { label: "POS Orders", to: "/admin/pos-orders" },
  { label: "Online Orders", to: "/admin/online-orders" },
  { label: "Countries", to: "/admin/countries" },
  { label: "Categories", to: "/admin/categories" },
  { label: "Homepage Banners", to: "/admin/banners" },
  { label: "Homepage Sections", to: "/admin/homepage" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Promotions", to: "/admin/promotions" },
  { label: "Product Sections", to: "/admin/product-sections" },
  { label: "SEO Settings", to: "/admin/seo-settings" },
  { label: "Hreflang Manager", to: "/admin/hreflang" },
  { label: "Sitemap & Robots", to: "/admin/sitemap-robots" },
  { label: "Admin Users", to: "/admin/users" },
] as const;

export default function AdminNotFoundPage() {
  const params = useParams();
  const _splat = Array.isArray(params?.slug) ? params.slug.join("/") : "";

  return (
    <AdminShell userName="Admin">
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-sale/10">
          <SearchX className="h-10 w-10 text-sale" />
        </div>
        <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          404
        </h1>
        <h2 className="mt-3 text-lg font-semibold text-foreground sm:text-xl">
          Admin page not found
        </h2>
        <p className="mt-2 max-w-md break-all text-sm text-muted-foreground">
          <span className="font-mono">/admin/{_splat}</span> does not exist. Pick one of the pages
          below.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="h-10 gap-2 rounded-lg bg-sale px-5 text-sm font-semibold text-primary-foreground hover:bg-sale/90"
          >
            <Link to="/admin/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 gap-2 rounded-lg px-5 text-sm font-semibold"
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to Store
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
          {PAGES.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="truncate rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-sale hover:text-sale"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
