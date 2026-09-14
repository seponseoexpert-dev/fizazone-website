import { useQuery } from "@tanstack/react-query";
import { getPublicShippingZones } from "@/lib/admin-settings.functions";
import type { CountryCode } from "@/lib/country";

export type IntlCountryCode = CountryCode;

export type ShipMethod = {
  id: string;
  label: string;
  note: string;
  cost: number;
  etaMin: number;
  etaMax: number;
};

export type IntlCountryConfig = {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  /** multiplier applied to base BDT price */
  rate: number;
  stateLabel: string;
  zipLabel: string;
  zipPattern: RegExp;
  freeOver: number;
  phonePlaceholder: string;
  phoneCode: string;
  taxLabel: string;
  taxRate: number;
  states: string[];
  payments: string[];
  standard: { cost: number; etaMin: number; etaMax: number };
  express: { cost: number; etaMin: number; etaMax: number };
};

export const INTL_COUNTRIES: Record<string, IntlCountryConfig> = {
  uk: {
    code: "uk",
    name: "United Kingdom",
    currency: "GBP",
    symbol: "£",
    rate: 0.0066,
    stateLabel: "County / Region",
    zipLabel: "Postcode",
    zipPattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    freeOver: 0,
    phonePlaceholder: "7400 123456",
    phoneCode: "+44",
    taxLabel: "VAT (20%)",
    taxRate: 0.2,
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    payments: ["eps", "cod"],
    standard: { cost: 3.99, etaMin: 3, etaMax: 5 },
    express: { cost: 8.99, etaMin: 1, etaMax: 2 },
  },
  usa: {
    code: "usa",
    name: "United States",
    currency: "USD",
    symbol: "$",
    rate: 0.0085,
    stateLabel: "State",
    zipLabel: "ZIP code",
    zipPattern: /^\d{5}(-\d{4})?$/,
    freeOver: 0,
    phonePlaceholder: "(555) 123-4567",
    phoneCode: "+1",
    taxLabel: "Sales tax (7%)",
    taxRate: 0.07,
    states: [
      "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
    ],
    payments: ["eps", "cod"],
    standard: { cost: 4.99, etaMin: 4, etaMax: 7 },
    express: { cost: 14.99, etaMin: 2, etaMax: 3 },
  },
  ca: {
    code: "ca",
    name: "Canada",
    currency: "CAD",
    symbol: "C$",
    rate: 0.0115,
    stateLabel: "Province",
    zipLabel: "Postal code",
    zipPattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    freeOver: 0,
    phonePlaceholder: "(416) 123-4567",
    phoneCode: "+1",
    taxLabel: "HST (13%)",
    taxRate: 0.13,
    states: [
      "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Ontario","Prince Edward Island","Quebec","Saskatchewan","Northwest Territories","Nunavut","Yukon",
    ],
    payments: ["eps", "cod"],
    standard: { cost: 6.99, etaMin: 4, etaMax: 8 },
    express: { cost: 16.99, etaMin: 2, etaMax: 3 },
  },
  au: {
    code: "au",
    name: "Australia",
    currency: "AUD",
    symbol: "A$",
    rate: 0.013,
    stateLabel: "State / Territory",
    zipLabel: "Postcode",
    zipPattern: /^\d{4}$/,
    freeOver: 0,
    phonePlaceholder: "0412 345 678",
    phoneCode: "+61",
    taxLabel: "GST (10%)",
    taxRate: 0.1,
    states: [
      "Australian Capital Territory","New South Wales","Northern Territory","Queensland","South Australia","Tasmania","Victoria","Western Australia",
    ],
    payments: ["eps", "cod"],
    standard: { cost: 7.99, etaMin: 5, etaMax: 9 },
    express: { cost: 18.99, etaMin: 2, etaMax: 4 },
  },
};

export const PAYMENT_LABELS: Record<string, string> = {
  eps: "Secure Card Payment (EPS)",
  cod: "Cash on Delivery",
  card: "Credit / Debit Card",
  paypal: "PayPal",
  applepay: "Apple Pay",
  googlepay: "Google Pay",
};

const num = (v: unknown, fallback: number) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback: string) =>
  typeof v === "string" && v.trim() ? v.trim() : fallback;

type ZoneRow = Record<string, unknown>;

/** Turn one admin-configured row into a full checkout config. */
function zoneToConfig(z: ZoneRow): IntlCountryConfig | null {
  const code = str(z["code"], "").toLowerCase();
  if (!code) return null;
  const base = (INTL_COUNTRIES as Record<string, IntlCountryConfig | undefined>)[code];
  const taxPct = num(z["tax"], base ? base.taxRate * 100 : 0);
  const payments = str(z["payments"], base?.payments.join(",") ?? "eps")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  return {
    code,
    name: str(z["name"], base?.name ?? code.toUpperCase()),
    currency: str(z["currency"], base?.currency ?? "USD"),
    symbol: str(z["symbol"], base?.symbol ?? "$"),
    rate: num(z["rate"], base?.rate ?? 0.0085),
    stateLabel: str(z["state_label"], base?.stateLabel ?? "State / Province / Region"),
    zipLabel: str(z["zip_label"], base?.zipLabel ?? "ZIP / Postal code"),
    zipPattern: base?.zipPattern ?? /^[A-Za-z0-9][A-Za-z0-9\s-]{2,10}$/,
    freeOver: num(z["free_over"], 0),
    phonePlaceholder: base?.phonePlaceholder ?? "Phone number",
    phoneCode: str(z["phone_code"], base?.phoneCode ?? "+"),
    taxLabel: `${(base?.taxLabel ?? "Tax").split(" (")[0]} (${taxPct}%)`,
    taxRate: taxPct / 100,
    states: base?.states ?? [],
    payments: payments.length ? payments : ["eps"],
    standard: {
      cost: num(z["standard_cost"], base?.standard.cost ?? 5),
      etaMin: num(z["standard_min"], base?.standard.etaMin ?? 4),
      etaMax: num(z["standard_max"], base?.standard.etaMax ?? 7),
    },
    express: {
      cost: num(z["express_cost"], base?.express.cost ?? 15),
      etaMin: num(z["express_min"], base?.express.etaMin ?? 2),
      etaMax: num(z["express_max"], base?.express.etaMax ?? 3),
    },
  };
}

/**
 * All international shipping countries configured by the admin
 * (`site_settings.shipping_intl.zones`). Falls back to the built-in
 * UK / USA / Canada / Australia set when nothing is configured yet.
 */
export function useShippingZones(): IntlCountryConfig[] {
  const { data } = useQuery({
    queryKey: ["shipping-zones", "public"],
    queryFn: () => getPublicShippingZones({}),
    staleTime: 60 * 1000,
  });

  const rows = (data ?? []) as ZoneRow[];
  const zones = Array.isArray(rows)
    ? (rows.map(zoneToConfig).filter(Boolean) as IntlCountryConfig[])
    : [];
  return zones.length ? zones : Object.values(INTL_COUNTRIES);
}


/** Config for one country code, from admin zones when available. */
export function useIntlConfig(code: string): IntlCountryConfig {
  const zones = useShippingZones();
  return (
    zones.find((z) => z.code === code) ??
    (INTL_COUNTRIES as Record<string, IntlCountryConfig | undefined>)[code] ??
    (zones[0] as IntlCountryConfig)
  );
}

export function etaLabel(min: number, max: number) {
  const fmt = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };
  return `${fmt(min)} – ${fmt(max)}`;
}

// The US market now lives at /us; keep the legacy "usa" key working too.
INTL_COUNTRIES["us"] = { ...INTL_COUNTRIES["usa"]!, code: "us" };
