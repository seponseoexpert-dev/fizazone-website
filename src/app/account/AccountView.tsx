"use client";

import { useState } from "react";
import { Link } from "@/components/ui/link";
import {
  Eye,
  EyeOff,
  Heart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Sections";
import { BottomNav } from "@/components/shop/BottomNav";
import { PageShell } from "@/components/shop/PageShell";
import { useAccount } from "@/lib/account";
import { useCountry } from "@/lib/country";
import { useQuery } from "@tanstack/react-query";
import { listOrdersByPhone } from "@/lib/orders.functions";

const field =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

export function AccountView() {
  const { user, address, wishlist, login, logout, saveAddress, toggleWishlist } =
    useAccount();
  const { format } = useCountry();
  const phone = address?.phone ?? user?.phone ?? "";
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", phone],
    queryFn: () => listOrdersByPhone({ phone }),
    enabled: Boolean(phone),
  });
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [tab, setTab] = useState<"orders" | "address" | "wishlist">("orders");

  if (!user) {
    return <AuthScreen mode={mode} setMode={setMode} login={login} />;
  }

  return (
    <PageShell title={`Hi, ${user.name.split(" ")[0]}`} subtitle={user.email} wide>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {(
            [
              ["orders", "Order history", Package],
              ["address", "Saved address", MapPin],
              ["wishlist", "Wishlist", Heart],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-sale bg-sale/10 text-sale"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              logout();
              toast.success("Signed out");
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        <section className="min-w-0">
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.date} · {o.items} item{o.items > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground">
                      {o.status}
                    </span>
                    <p className="text-sm font-bold text-sale">{format(o.total)}</p>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {phone
                    ? "No orders found for your saved mobile number yet."
                    : "Save your delivery address with a mobile number to see your orders here."}
                </p>
              )}
              <Link
                to="/track-order"
                className="inline-block text-sm font-semibold text-sale underline-offset-4 hover:underline"
              >
                Track an order →
              </Link>
            </div>
          )}

          {tab === "address" && (
            <form
              className="max-w-md space-y-4 rounded-xl border border-border bg-card p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                saveAddress({
                  name: d.get("n") as string,
                  phone: d.get("p") as string,
                  address: d.get("a") as string,
                  city: d.get("c") as string,
                });
                toast.success("Address saved");
              }}
            >
              <input
                name="n"
                required
                defaultValue={address?.name ?? user.name}
                placeholder="Full name"
                aria-label="Full name"
                className={field}
              />
              <input
                name="p"
                required
                defaultValue={address?.phone ?? ""}
                placeholder="Mobile number"
                aria-label="Mobile number"
                className={field}
              />
              <input
                name="a"
                required
                defaultValue={address?.address ?? ""}
                placeholder="Full address"
                aria-label="Full address"
                className={field}
              />
              <input
                name="c"
                required
                defaultValue={address?.city ?? ""}
                placeholder="City"
                aria-label="City"
                className={field}
              />
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-sale text-sm font-bold uppercase tracking-wide text-primary-foreground"
              >
                Save address
              </button>
            </form>
          )}

          {tab === "wishlist" &&
            (wishlist.length === 0 ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
                <Heart className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Your wishlist is empty.</p>
                <Link to="/categories" className="mt-3 text-sm font-semibold text-sale">
                  Start shopping →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {wishlist.map((w) => (
                  <div key={w.id} className="rounded-xl border border-border bg-card p-3">
                    <img
                      src={w.image}
                      alt={w.name}
                      loading="lazy"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-medium">{w.name}</p>
                    <p className="text-sm font-bold text-sale">{format(w.price)}</p>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(w)}
                      className="mt-2 w-full rounded-md border border-border py-1.5 text-[11px] font-medium hover:bg-secondary"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
        </section>
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5" /> Demo account data is stored on this device. Real accounts
        arrive with the backend step.
      </p>
    </PageShell>
  );
}

function AuthScreen({
  mode,
  setMode,
  login,
}: {
  mode: "login" | "signup";
  setMode: (m: "login" | "signup") => void;
  login: (u: { name: string; email: string }) => void;
}) {
  const [showPass, setShowPass] = useState(false);
  const signup = mode === "signup";
  const input =
    "h-12 w-full rounded-xl border border-transparent bg-auth-field pl-11 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-auth-blue focus:bg-background";

  return (
    <div className="min-h-screen bg-secondary/40 pb-24 lg:pb-0">
      <Header />
      <main className="grid place-items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_10px_40px_-20px_oklch(0.21_0.03_264/0.35)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-auth-blue-soft">
              <Mail className="h-6 w-6 text-auth-blue" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground">
              {signup ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {signup ? "Join Faiza Zone in seconds" : "Sign in to your account"}
            </p>
          </div>

          <form
            className="mt-7 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              login({
                name: (data.get("name") as string) || "Faiza Customer",
                email: data.get("email") as string,
              });
              toast.success(signup ? "Account created" : "Welcome back!");
            }}
          >
            {signup && (
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input name="name" required placeholder="Full name" aria-label="Full name" className={input} />
              </div>
            )}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                aria-label="Email address"
                className={input}
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="password"
                type={showPass ? "text" : "password"}
                required
                placeholder="Password"
                aria-label="Password"
                className={input}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {!signup && (
              <div className="flex justify-end">
                <button type="button" className="text-xs font-medium text-auth-blue hover:underline">
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-auth-blue text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {signup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => login({ name: "Google User", email: "user@gmail.com" })}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6C12.3 14 17.6 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.500-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6z" />
                <path fill="#FBBC05" d="M10.4 28.2c-.5-1.4-.8-2.9-.8-4.2s.3-2.9.8-4.2l-7.8-6C.9 17 0 20.4 0 24s.9 7 2.6 10.2l7.8-6z" />
                <path fill="#34A853" d="M24 47.5c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.6 2.3-6.4 0-11.7-4.5-13.6-10.2l-7.8 6C6.5 42.1 14.6 47.5 24 47.5z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => login({ name: "Facebook User", email: "user@facebook.com" })}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="#1877F2" d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8V12h3.2l-.5 3.5h-2.7v8.4A12 12 0 0024 12z" />
              </svg>
              Continue with Facebook
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {signup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(signup ? "login" : "signup")}
              className="font-semibold text-auth-blue hover:underline"
            >
              {signup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
