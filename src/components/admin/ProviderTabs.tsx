import { useState, type ReactNode } from "react";

export type ProviderField = {
  name: string;
  label: string;
  type?: "text" | "password" | "select" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
  full?: boolean;
};

export type ProviderDef = {
  key: string;
  label: string;
  fields: ProviderField[];
};

export type ProviderValues = Record<string, Record<string, unknown>>;

const inputCls =
  "h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

export function ProviderTabs({
  providers,
  value,
  onChange,
  custom,
}: {
  providers: ProviderDef[];
  value: ProviderValues;
  onChange: (next: ProviderValues) => void;
  custom?: Record<string, ReactNode>;
}) {
  const [tab, setTab] = useState(providers[0]?.key ?? "");
  const active = providers.find((p) => p.key === tab) ?? providers[0];
  const current = (value?.[active?.key ?? ""] ?? {}) as Record<string, unknown>;

  function set(name: string, v: unknown) {
    if (!active) return;
    onChange({ ...value, [active.key]: { ...current, [name]: v } });
  }

  if (!active) return null;

  return (
    <div className="min-w-0 space-y-5">
      {/* Tabs */}
      <div className="-mx-1 flex min-w-0 max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-secondary p-1.5 sm:mx-0">
        {providers.map((p) => {
          const isActive = p.key === active.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setTab(p.key)}
              className={`h-10 shrink-0 flex-1 whitespace-nowrap rounded-xl px-4 text-xs font-semibold transition sm:text-sm ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0">
        <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">{active.label}</h3>

        {custom?.[active.key] ? (
          custom[active.key]
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {active.fields.map((f) => {
              const id = `${active.key}-${f.name}`;
              const raw = current[f.name];
              const wrap = f.full || f.type === "textarea" ? "sm:col-span-2" : "";
              return (
                <div key={id} className={`min-w-0 ${wrap}`}>
                  <label className={labelCls} htmlFor={id}>
                    {f.label}
                  </label>
                  {f.type === "select" ? (
                    <select
                      id={id}
                      className={inputCls}
                      value={typeof raw === "string" ? raw : (f.options?.[0]?.value ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={id}
                      rows={3}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sale"
                      value={typeof raw === "string" ? raw : ""}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  ) : (
                    <input
                      id={id}
                      type={f.type === "password" ? "password" : "text"}
                      autoComplete="off"
                      placeholder={f.placeholder ?? f.label}
                      className={inputCls}
                      value={typeof raw === "string" ? raw : ""}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
