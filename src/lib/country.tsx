"use client";

import { getVisitorCountry } from "@/lib/geo.functions";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketsQueryOptions, isShoppable, resolveMarket, type Market } from "@/lib/markets";

/**
 * A market code is the storefront URL prefix (bd, uk, us, …). Markets are
 * defined in Admin → Countries, so this is intentionally an open string type.
 */
export type CountryCode = string;

export type CountrySetting = {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  symbol: string;
  /** multiplier applied to base BDT prices */
  rate: number;
  taxRate: number;
  taxLabel: string;
  shippingFlat: number;
  freeShippingOver: number;
  locale: string;
};

/** Static fallbacks — used only until the DB markets load, or for extras
 *  (tax / shipping defaults) that are not stored per market yet. */
export const countrySettings: Record<string, CountrySetting> = {
  bd: {
    code: "bd",
    name: "Bangladesh",
    flag: "🇧🇩",
    currency: "BDT",
    symbol: "৳",
    rate: 1,
    taxRate: 0,
    taxLabel: "VAT",
    shippingFlat: 100,
    freeShippingOver: 2000,
    locale: "en-BD",
  },
  us: {
    code: "us",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD",
    symbol: "$",
    rate: 0.0085,
    taxRate: 0.07,
    taxLabel: "Sales tax",
    shippingFlat: 12,
    freeShippingOver: 120,
    locale: "en-US",
  },
  uk: {
    code: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP",
    symbol: "£",
    rate: 0.0066,
    taxRate: 0.2,
    taxLabel: "VAT",
    shippingFlat: 9,
    freeShippingOver: 100,
    locale: "en-GB",
  },
  ca: {
    code: "ca",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    symbol: "C$",
    rate: 0.0115,
    taxRate: 0.13,
    taxLabel: "HST",
    shippingFlat: 15,
    freeShippingOver: 150,
    locale: "en-CA",
  },
  au: {
    code: "au",
    name: "Australia",
    flag: "🇦🇺",
    currency: "AUD",
    symbol: "A$",
    rate: 0.013,
    taxRate: 0.1,
    taxLabel: "GST",
    shippingFlat: 18,
    freeShippingOver: 160,
    locale: "en-AU",
  },
};
// Legacy alias — the US market used to live at /usa.
countrySettings["usa"] = { ...countrySettings["us"]!, code: "usa" };

export const countryList = Object.values(countrySettings);

/** Converts a DB market row into the storefront's country settings shape. */
export function marketToSetting(m: Market): CountrySetting {
  const base = countrySettings[m.prefix] ?? countrySettings[m.code] ?? countrySettings["bd"]!;
  return {
    code: m.prefix,
    name: m.name,
    flag: base.flag,
    currency: m.currency || base.currency,
    symbol: m.symbol || base.symbol,
    rate: m.fxRate || base.rate,
    taxRate: base.taxRate,
    taxLabel: base.taxLabel,
    shippingFlat: base.shippingFlat,
    freeShippingOver: base.freeShippingOver,
    locale: m.locale || base.locale,
  };
}

const STORAGE_KEY = "fiza-country";
const COOKIE_NAME = "fiza_country";

function syncCookie(val: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${val}; path=/; max-age=31536000; SameSite=Lax`;
}

function getStoredCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

type CountryContextValue = {
  country: CountrySetting;
  /** Country resolved from the visitor's IP / edge headers (null until known). */
  detected: CountryCode | null;
  /** All shoppable markets straight from Admin → Countries. */
  markets: Market[];
  setCountry: (code: CountryCode) => void;
  format: (baseBdt: number) => string;
  convert: (baseBdt: number) => number;
};

const CountryContext = createContext<CountryContextValue | null>(null);

const ipToCode = (raw: string | null | undefined): CountryCode | null => {
  if (!raw) return null;
  const c = raw.toUpperCase();
  if (c === "BD") return "bd";
  if (c === "US") return "us";
  if (c === "GB" || c === "UK") return "uk";
  if (c === "CA") return "ca";
  if (c === "AU") return "au";
  return null;
};

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState<CountryCode>("bd");
  const [detected, setDetected] = useState<CountryCode | null>(null);
  const { data: allMarkets } = useQuery(marketsQueryOptions());

  const markets = useMemo(() => (allMarkets ?? []).filter(isShoppable), [allMarkets]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || getStoredCookie();
    const hasSaved = Boolean(saved);
    if (saved) {
      setCode(saved);
      syncCookie(saved);
    }

    let cancelled = false;

    const applyDetected = (next: CountryCode | null) => {
      if (cancelled || !next) return;
      setDetected(next);
      if (!hasSaved) {
        setCode(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
          syncCookie(next);
        } catch {
          /* ignore */
        }
      }
    };

    // IP detection only pre-selects a suggested market — it never redirects.
    getVisitorCountry()
      .then((res) => {
        const fromServer = ipToCode(res?.country);
        if (fromServer) {
          applyDetected(fromServer);
          return null;
        }
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 2500);
        return fetch("https://ipapi.co/json/", { signal: controller.signal })
          .then((r) => (r.ok ? r.json() : null))
          .then((data: { country_code?: string } | null) => applyDetected(ipToCode(data?.country_code)));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CountryContextValue>(() => {
    const market = resolveMarket(markets, code);
    const country =
      (market ? marketToSetting(market) : countrySettings[code]) ??
      (markets[0] ? marketToSetting(markets[0]) : countrySettings["bd"]!);
    const convert = (baseBdt: number) =>
      country.rate === 1 ? baseBdt : Math.round(baseBdt * country.rate * 100) / 100;
    return {
      country,
      detected,
      markets,
      setCountry: (next) => {
        setCode(next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
          syncCookie(next);
        } catch {
          /* ignore */
        }
      },
      convert,
      format: (baseBdt: number) => `${country.symbol}${convert(baseBdt).toFixed(2)}`,
    };
  }, [code, detected, markets]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used inside CountryProvider");
  return ctx;
}
