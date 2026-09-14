import { Plus, Trash2 } from "lucide-react";

export type ShippingZone = {
  code: string;
  name: string;
  currency: string;
  symbol: string;
  rate: number;
  state_label: string;
  zip_label: string;
  phone_code: string;
  tax: number;
  standard_cost: number;
  standard_min: number;
  standard_max: number;
  express_cost: number;
  express_min: number;
  express_max: number;
  free_over: number;
  payments: string;
};

export const emptyZone = (): ShippingZone => ({
  code: "",
  name: "",
  currency: "USD",
  symbol: "$",
  rate: 0.0085,
  state_label: "State / Province / Region",
  zip_label: "ZIP / Postal code",
  phone_code: "+1",
  tax: 0,
  standard_cost: 5,
  standard_min: 4,
  standard_max: 7,
  express_cost: 15,
  express_min: 2,
  express_max: 3,
  free_over: 0,
  payments: "card,paypal",
});

const cell =
  "h-10 w-full min-w-0 rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition focus:border-sale";

const NUMS = [
  "rate",
  "tax",
  "standard_cost",
  "standard_min",
  "standard_max",
  "express_cost",
  "express_min",
  "express_max",
  "free_over",
] as const;

const FIELDS: { key: keyof ShippingZone; label: string; placeholder?: string; wide?: boolean }[] = [
  { key: "code", label: "Country code", placeholder: "de" },
  { key: "name", label: "Country name", placeholder: "Germany", wide: true },
  { key: "currency", label: "Currency", placeholder: "EUR" },
  { key: "symbol", label: "Symbol", placeholder: "€" },
  { key: "rate", label: "Rate from ৳1", placeholder: "0.0078" },
  { key: "phone_code", label: "Phone code", placeholder: "+49" },
  { key: "state_label", label: "State field label", wide: true },
  { key: "zip_label", label: "Postcode field label", wide: true },
  { key: "tax", label: "Tax rate (%)" },
  { key: "standard_cost", label: "Standard cost" },
  { key: "standard_min", label: "Standard min days" },
  { key: "standard_max", label: "Standard max days" },
  { key: "express_cost", label: "Express cost" },
  { key: "express_min", label: "Express min days" },
  { key: "express_max", label: "Express max days" },
  { key: "free_over", label: "Free shipping over (0 = off)" },
  { key: "payments", label: "Payments (card,paypal,applepay,googlepay)", wide: true },
];

export function ShippingZones({
  value,
  onChange,
}: {
  value: ShippingZone[];
  onChange: (next: ShippingZone[]) => void;
}) {
  const zones = Array.isArray(value) ? value : [];

  const update = (idx: number, key: keyof ShippingZone, raw: string) => {
    const isNum = (NUMS as readonly string[]).includes(key);
    onChange(
      zones.map((z, i) =>
        i === idx ? { ...z, [key]: isNum ? (raw === "" ? 0 : Number(raw)) : raw } : z,
      ),
    );
  };

  return (
    <div className="grid gap-4">
      {zones.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No countries yet. Add your first international shipping country.
        </p>
      )}

      {zones.map((z, idx) => (
        <div key={idx} className="rounded-2xl border border-border p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {z.name || z.code || `Country ${idx + 1}`}
              {z.currency ? (
                <span className="ml-2 text-xs font-medium text-muted-foreground">{z.currency}</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => onChange(zones.filter((_, i) => i !== idx))}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-sale transition hover:bg-sale/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map((f) => (
              <label key={String(f.key)} className={f.wide ? "sm:col-span-2" : ""}>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </span>
                <input
                  className={cell}
                  type={(NUMS as readonly string[]).includes(f.key) ? "number" : "text"}
                  step="any"
                  placeholder={f.placeholder ?? ""}
                  value={String(z[f.key] ?? "")}
                  onChange={(e) => update(idx, f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...zones, emptyZone()])}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-semibold text-foreground transition hover:border-sale hover:text-sale"
      >
        <Plus className="h-4 w-4" /> Add country
      </button>
    </div>
  );
}
