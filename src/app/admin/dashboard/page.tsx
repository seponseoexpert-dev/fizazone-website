"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Coins,
  Loader2,
  PackageCheck,
  RotateCcw,
  ShoppingCart,
  Timer,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin, signedUrls } from "@/lib/admin-products";
import { resolveImage } from "@/lib/catalog";
import { COUNTRY_OPTIONS, fetchMyAdminRole } from "@/lib/content";

type OrderRow = {
  id: string;
  created_at: string;
  customer_name: string;
  status: string;
  total: number;
  country_code: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  images: string[];
  created_at: string;
};

const STATUSES = [
  { key: "all", label: "Total Orders", icon: ShoppingCart, tone: "text-sale bg-sale/10" },
  { key: "pending", label: "Pending", icon: Timer, tone: "text-brand-yellow bg-brand-yellow/15" },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    tone: "text-brand-green bg-brand-green/15",
  },
  { key: "ongoing", label: "Ongoing", icon: Truck, tone: "text-accent bg-accent/10" },
  {
    key: "delivered",
    label: "Delivered",
    icon: PackageCheck,
    tone: "text-brand-forest bg-brand-forest/15",
  },
  { key: "canceled", label: "Canceled", icon: XCircle, tone: "text-destructive bg-destructive/10" },
  { key: "returned", label: "Returned", icon: RotateCcw, tone: "text-accent bg-accent/10" },
  { key: "rejected", label: "Rejected", icon: XCircle, tone: "text-sale bg-sale/10" },
] as const;

const money = (n: number) =>
  `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning!";
  if (h < 17) return "Good Afternoon!";
  return "Good Evening!";
}

export default function AdminDashboardPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [productCountry, setProductCountry] = useState<
    { product_id: string; country_code: string; is_visible: boolean }[]
  >([]);
  const [customerCountries, setCustomerCountries] = useState<string[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [userName, setUserName] = useState("Admin");
  const [country, setCountry] = useState("all");
  const [lockedCountry, setLockedCountry] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setLoading(false);
        return;
      }
      setUserName(data.user.email?.split("@")[0] ?? "Admin");
      const ok = await isAdmin(data.user.id);
      setAllowed(ok);
      if (!ok) {
        setLoading(false);
        return;
      }

      const myRole = await fetchMyAdminRole(data.user.id, data.user.email);
      if (myRole?.role === "country_manager" && myRole.country_code) {
        setLockedCountry(myRole.country_code);
        setCountry(myRole.country_code);
      }

      const [o, p, c, pcm] = await Promise.all([
        supabase.from("orders").select("id, created_at, customer_name, status, total, country_code"),
        supabase
          .from("products")
          .select("id, name, price, sale_price, images, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("country_code"),
        supabase.from("product_country_map").select("product_id, country_code, is_visible"),
      ]);

      const orderRows = (o.data ?? []) as OrderRow[];
      const productRows = (p.data ?? []) as ProductRow[];
      setAllOrders(orderRows);
      setAllProducts(productRows);
      setCustomerCountries(
        ((c.data ?? []) as { country_code: string | null }[]).map((x) => x.country_code ?? "bd"),
      );
      setProductCountry(
        (pcm.data ?? []) as { product_id: string; country_code: string; is_visible: boolean }[],
      );
      setUrls(await signedUrls(productRows.slice(0, 12).flatMap((x) => x.images ?? [])));
      setLoading(false);
    })();
  }, []);

  const orders = useMemo(
    () =>
      country === "all"
        ? allOrders
        : allOrders.filter((o) => (o.country_code ?? "bd") === country),
    [allOrders, country],
  );

  const products = useMemo(() => {
    if (country === "all") return allProducts;
    const hidden = new Set(
      productCountry.filter((r) => r.country_code === country && !r.is_visible).map((r) => r.product_id),
    );
    return allProducts.filter((p) => !hidden.has(p.id));
  }, [allProducts, productCountry, country]);

  const customers = useMemo(
    () =>
      country === "all"
        ? customerCountries.length
        : customerCountries.filter((c) => c === country).length,
    [customerCountries, country],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const s of STATUSES) if (s.key !== "all") map[s.key] = 0;
    for (const o of orders) {
      const k = (o.status ?? "pending").toLowerCase();
      if (k in map) map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [orders]);

  const earnings = useMemo(() => orders.reduce((s, o) => s + Number(o.total ?? 0), 0), [orders]);

  const salesSeries = useMemo(() => {
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const buckets = Array.from({ length: days }, (_, i) => ({ day: String(i + 1), sales: 0 }));
    for (const o of orders) {
      const d = new Date(o.created_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const b = buckets[d.getDate() - 1];
        if (b) b.sales += Number(o.total ?? 0);
      }
    }
    return buckets;
  }, [orders]);

  const totalSales = salesSeries.reduce((s, d) => s + d.sales, 0);
  const avgSales = totalSales / (salesSeries.length || 1);

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.customer_name, (map.get(o.customer_name) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [orders]);

  const share = (key: string) =>
    counts["all"] ? Math.round(((counts[key] ?? 0) / counts["all"]) * 100) : 0;

  if (allowed === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This dashboard is restricted to store administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell userName={userName}>
      {loading ? (
        <div className="grid h-[60vh] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-xl font-extrabold text-sale sm:text-2xl">
              {greeting()}
            </h1>
            <p className="text-sm text-muted-foreground">{userName}</p>
          </div>

          {/* Overview */}
          <section>
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
              <h2 className="truncate font-display text-base font-bold text-foreground">Overview</h2>
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">Country</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={!!lockedCountry}
                  className="h-9 min-w-0 max-w-[9.5rem] rounded-lg border border-border bg-background px-2 text-xs outline-none transition focus:border-sale disabled:opacity-70 sm:max-w-none sm:px-3 sm:text-sm"
                >
                  <option value="all">All countries</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {lockedCountry && (
                  <span className="hidden rounded-full bg-sale/10 px-2.5 py-1 text-[11px] font-semibold text-sale sm:inline">
                    Country Manager
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
              <StatTile
                icon={Coins}
                label="Total Earnings"
                value={money(earnings)}
                className="bg-sale text-primary-foreground"
              />
              <StatTile
                icon={ShoppingCart}
                label="Total Orders"
                value={String(orders.length)}
                className="bg-destructive text-destructive-foreground"
              />
              <StatTile
                icon={Users}
                label="Total Customers"
                value={String(customers)}
                className="bg-accent text-accent-foreground"
              />
              <StatTile
                icon={PackageCheck}
                label="Total Products"
                value={String(products.length)}
                className="bg-brand-forest text-primary-foreground"
              />
            </div>
          </section>

          {/* Order statistics */}
          <section>
            <h2 className="mb-3 font-display text-base font-bold text-foreground">
              Order Statistics
            </h2>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              {STATUSES.map((s) => (
                <div
                  key={s.key}
                  className="card-elevated flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 sm:gap-3 sm:p-4"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 ${s.tone}`}>
                    <s.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{s.label}</p>
                    <p className="font-display text-base font-bold text-foreground sm:text-lg">
                      {counts[s.key] ?? 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sales + orders summary */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Sales Summary">
              <div className="flex flex-wrap gap-x-6 gap-y-3 pb-4">
                <Metric label="Total Sales" value={money(totalSales)} />
                <Metric label="Avg Sales Per Day" value={money(avgSales)} />
              </div>
              <div className="h-44 w-full sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesSeries} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--sale)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--sale)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 12,
                      }}
                      formatter={(v: number) => money(Number(v))}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--sale)"
                      strokeWidth={2}
                      fill="url(#salesFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Orders Summary">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
                <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full border-8 border-secondary sm:h-36 sm:w-36">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {orders.length}
                    </p>
                  </div>
                </div>
                <div className="w-full space-y-4">
                  {[
                    { label: "Delivered", key: "delivered", color: "bg-brand-forest" },
                    { label: "Canceled", key: "canceled", color: "bg-accent" },
                    { label: "Rejected", key: "rejected", color: "bg-sale" },
                  ].map((row) => (
                    <div key={row.key}>
                      <p className="mb-1.5 text-xs font-medium text-foreground">
                        {row.label} ({share(row.key)}%)
                      </p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${Math.max(share(row.key), 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Top customers */}
          <Panel title="Top Customers">
            {topCustomers.length === 0 ? (
              <Empty text="No customer orders yet." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {topCustomers.map(([name, n]) => (
                  <div
                    key={name}
                    className="rounded-xl border border-border p-3 text-center text-sm"
                  >
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-green/20 font-bold text-brand-forest">
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                    <p className="mt-2 truncate font-medium text-foreground">{name}</p>
                    <span className="mt-2 inline-block rounded-md bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">
                      {n} Orders
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Top products */}
          <Panel title="Top Products">
            {products.length === 0 ? (
              <Empty text="No products yet. Add products to see them here." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {products.slice(0, 8).map((p) => {
                  const raw = p.images?.[0] ?? "";
                  const src = raw ? (urls[raw] || resolveImage(raw, p.id)) : "";
                  return (
                    <article key={p.id} className="overflow-hidden rounded-xl border border-border">
                      <div className="aspect-square bg-secondary">
                        {src ? (
                          <img
                            src={src}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                        <p className="mt-1 font-display text-sm font-bold text-foreground">
                          {money(Number(p.sale_price ?? p.price))}
                          {p.sale_price ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                              {money(Number(p.price))}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl p-3 sm:gap-3 sm:p-4 ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/20 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] opacity-90 sm:text-xs">{label}</p>
        <p className="truncate font-display text-base font-extrabold sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-elevated rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-4 font-display text-base font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
