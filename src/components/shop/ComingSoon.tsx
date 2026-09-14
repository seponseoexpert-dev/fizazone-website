"use client";

import { useState } from "react";
import { Link } from "@/components/ui/link";
import { ArrowRight, Bell, Mail, MapPin } from "lucide-react";
import { Header } from "@/components/shop/Header";
import { countrySettings, type CountryCode } from "@/lib/country";
import { useActiveCountries } from "@/lib/active-countries";
import { toast } from "sonner";


export function ComingSoon({ code, name }: { code: CountryCode; name?: string }) {
  // Derive the market directly from the route so the page always shows the
  // requested market even if the user's stored market is different.
  const fallback = countrySettings[code] ?? countrySettings["bd"]!;
  const country = { ...fallback, code, ...(name ? { name } : {}) };
  const activeMarkets = useActiveCountries().filter((m) => m.code !== code);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    // In a real launch this would POST to a waitlist endpoint.
    setSubmitted(true);
    toast.success("You're on the list! We'll email you when we launch.");
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />
      <main className="shop-container flex flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
        <div
          aria-hidden="true"
          className="grid h-20 w-20 place-items-center rounded-full bg-accent/10 text-2xl font-extrabold text-accent sm:h-24 sm:w-24 sm:text-3xl"
        >
          {country.code.toUpperCase()}
        </div>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
          <Bell className="h-4 w-4" />
          Launching soon
        </p>

        <h1 className="mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">
          Faiza Zone is coming to {country.name}
        </h1>

        <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          Be the first to shop our latest collections. Prices will be shown in{" "}
          <span className="font-semibold text-foreground">{country.currency}</span>{" "}
          with local delivery options.
        </p>

        <div className="mt-8 grid w-full max-w-md gap-4">
          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-full border border-border bg-secondary pl-10 pr-4 text-sm outline-none transition focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-accent-foreground transition hover:bg-accent/90 active:scale-95"
              >
                Notify me
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-border bg-secondary p-6 text-center">
              <p className="font-semibold text-foreground">Thanks for subscribing!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll let you know as soon as Faiza Zone launches in {country.name}.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Expected availability: <span className="font-medium text-foreground">Q4 2026</span>
          </p>
        </div>

        <div className="mt-12 w-full max-w-3xl rounded-2xl border border-border bg-secondary/50 p-6 text-left sm:p-8">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Shop now from an active market
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You can already order from these regions while we prepare {country.name}.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {activeMarkets.map((m) => (
              <Link
                key={m.code}
                to="/$market"
                params={{ market: m.code }}
                className="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition hover:border-accent hover:shadow-sm"
              >
                <span className="font-medium text-foreground">{m.name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
