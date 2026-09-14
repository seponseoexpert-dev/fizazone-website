"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import {
  countryDependencies,
  deleteCountry,
  fetchCountries,
  saveCountry,
  type Country,
} from "@/lib/localization";
import { mapMarket, normalizePrefix, seoHealth, type SeoHealth } from "@/lib/markets";
import { SITE_URL } from "@/lib/social";


const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

type Form = Partial<Country>;

const emptyForm: Form = {
  name: "",
  code: "",
  iso_code: "",
  url_prefix: "",
  currency: "USD",
  currency_symbol: "$",
  default_language: "en",
  locale: "en",
  timezone: "UTC",
  date_format: "DD/MM/YYYY",
  number_format: "1,234.56",
  fx_rate: 1,
  phone_code: "",
  is_active: true,
  is_default_market: false,
  sort_order: 0,
  seo_title: "",
  seo_description: "",
  canonical_base: "",
  hreflang: "",
  og_title: "",
  og_description: "",
  og_image: "",
  storefront_enabled: true,
  shipping_enabled: true,
  cod_enabled: false,
  online_payment_enabled: true,
  regional_pricing_enabled: false,
};

const TABS = ["Basic", "Localization", "SEO", "Storefront"] as const;
type Tab = (typeof TABS)[number];

function health(row: Country): SeoHealth {
  return seoHealth(mapMarket(row as unknown as Record<string, unknown>));
}

function storefrontUrl(row: Country) {
  const prefix = normalizePrefix(row.url_prefix || row.code);
  return `${SITE_URL}/${prefix}`;
}

export default function AdminCountriesPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [tab, setTab] = useState<Tab>("Basic");
  const [saving, setSaving] = useState(false);
  const [seoDetail, setSeoDetail] = useState<{ row: Country; result: SeoHealth } | null>(null);

  const queryClient = useQueryClient();

  const load = useCallback(async () => {
    try {
      setRows(await fetchCountries());
      // Storefront market list reads the same data through React Query.
      void queryClient.invalidateQueries({ queryKey: ["markets"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load countries");
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setLoading(false);
        return;
      }
      const ok = await isAdmin(data.user.id);
      setAllowed(ok);
      if (ok) void load();
      else setLoading(false);
    })();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        (r.iso_code ?? "").toLowerCase().includes(q) ||
        (r.url_prefix ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (allowed === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Admins only</h1>
          <button
            onClick={() => router.push("/" )}
            className="mt-5 h-10 rounded-lg bg-sale px-5 text-sm font-semibold text-primary-foreground"
          >
            Back to store
          </button>
        </div>
      </div>
    );
  }

  async function toggle(row: Country) {
    try {
      await saveCountry({ ...row, is_active: !row.is_active });
      toast.success(`${row.name} ${row.is_active ? "disabled" : "enabled"}`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(row: Country) {
    try {
      const used = await countryDependencies(row);
      if (used.length) {
        toast.error("Country cannot be deleted because it is currently being used.", {
          description: `In use by: ${used.join(", ")}. Deactivate the market instead.`,
        });
        return;
      }
      if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
      await deleteCountry(row.id);
      toast.success("Country deleted");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function copyUrl(row: Country) {
    try {
      await navigator.clipboard.writeText(storefrontUrl(row));
      toast.success("Storefront URL copied");
    } catch {
      toast.error("Could not copy the URL");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveCountry(form);
      toast.success(form.id ? "Country updated" : "Country added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const openForm = (next: Form) => {
    setTab("Basic");
    setForm(next);
  };

  const activeCount = rows.filter((r) => r.is_active).length;
  const set = (patch: Form) => setForm((f) => ({ ...(f ?? {}), ...patch }));

  return (
    <AdminShell>
      <div className="min-w-0 space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Countries
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Markets, currencies, localization and SEO your storefront supports
            </p>
          </div>
          <button
            onClick={() => openForm({ ...emptyForm })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add country
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Total markets" value={rows.length} tone="text-sale bg-sale/10" />
          <StatTile
            label="Active markets"
            value={activeCount}
            tone="text-emerald-600 bg-emerald-500/10"
          />
        </div>

        <div className="min-w-0 rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country, ISO or URL…"
                className={`${field} pl-9`}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No countries found.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">Country</th>
                      <th className="p-3">ISO</th>
                      <th className="p-3">URL</th>
                      <th className="p-3">Currency</th>
                      <th className="p-3">Locale</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">SEO</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const result = health(r);
                      return (
                        <tr key={r.id} className="border-t border-border">
                          <td className="p-3 font-medium">
                            <span className="flex items-center gap-2">
                              {r.name}
                              {r.is_default_market && (
                                <span className="rounded-full bg-sale/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-sale">
                                  x-default
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3 uppercase text-muted-foreground">{r.iso_code || "—"}</td>
                          <td className="p-3 font-mono text-xs">
                            /{normalizePrefix(r.url_prefix || r.code)}
                          </td>
                          <td className="p-3">
                            {r.currency} {r.currency_symbol}
                          </td>
                          <td className="p-3">{r.locale || "—"}</td>
                          <td className="p-3">{r.phone_code || "—"}</td>
                          <td className="p-3">
                            <StatusBadge active={r.is_active} />
                          </td>
                          <td className="p-3">
                            <SeoBadge result={result} onClick={() => setSeoDetail({ row: r, result })} />
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              <a
                                href={storefrontUrl(r)}
                                target="_blank"
                                rel="noreferrer"
                                title="Preview storefront"
                                aria-label="Preview storefront"
                                className="grid h-9 w-9 place-items-center rounded-lg border border-border transition hover:bg-secondary"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <RowBtn label="Copy URL" onClick={() => copyUrl(r)}>
                                <Copy className="h-4 w-4" />
                              </RowBtn>
                              <RowBtn label="Toggle status" onClick={() => toggle(r)}>
                                <Power className="h-4 w-4" />
                              </RowBtn>
                              <RowBtn label="Edit" onClick={() => openForm(r)}>
                                <Pencil className="h-4 w-4" />
                              </RowBtn>
                              <RowBtn label="Delete" danger onClick={() => remove(r)}>
                                <Trash2 className="h-4 w-4" />
                              </RowBtn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <ul className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
                {filtered.map((r) => {
                  const result = health(r);
                  return (
                    <li key={r.id} className="min-w-0 rounded-xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                            <Globe className="h-4 w-4 shrink-0 text-sale" />
                            <span className="truncate">{r.name}</span>
                            <span className="text-xs uppercase text-muted-foreground">
                              ({r.iso_code || r.code})
                            </span>
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            /{normalizePrefix(r.url_prefix || r.code)} · {r.currency}{" "}
                            {r.currency_symbol} · {r.locale || "—"} · {r.phone_code || "—"}
                          </p>
                        </div>
                        <StatusBadge active={r.is_active} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <SeoBadge result={result} onClick={() => setSeoDetail({ row: r, result })} />
                        {r.is_default_market && (
                          <span className="rounded-full bg-sale/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-sale">
                            x-default
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={storefrontUrl(r)}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-9 w-9 place-items-center rounded-lg border border-border"
                          aria-label="Preview storefront"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <RowBtn label="Copy URL" onClick={() => copyUrl(r)}>
                          <Copy className="h-4 w-4" />
                        </RowBtn>
                        <RowBtn label="Toggle status" onClick={() => toggle(r)}>
                          <Power className="h-4 w-4" />
                        </RowBtn>
                        <RowBtn label="Edit" onClick={() => openForm(r)}>
                          <Pencil className="h-4 w-4" />
                        </RowBtn>
                        <RowBtn label="Delete" danger onClick={() => remove(r)}>
                          <Trash2 className="h-4 w-4" />
                        </RowBtn>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* SEO detail */}
      {seoDetail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold">{seoDetail.row.name} · SEO</h2>
                <p className="mt-1">
                  <SeoBadge result={seoDetail.result} />
                </p>
              </div>
              <button
                onClick={() => setSeoDetail(null)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {seoDetail.result.missing.length ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {seoDetail.result.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Everything is configured: prefix, locale, currency, SEO title, meta description,
                canonical and hreflang.
              </p>
            )}
            <button
              onClick={() => {
                openForm(seoDetail.row);
                setSeoDetail(null);
              }}
              className="mt-5 h-10 w-full rounded-lg bg-sale text-sm font-semibold text-primary-foreground"
            >
              Edit market
            </button>
          </div>
        </div>
      )}

      {/* Add / edit market */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={submit}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-border bg-card sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
              <h2 className="font-display text-base font-extrabold sm:text-xl">
                {form.id ? "Edit market" : "Add market"}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 border-b border-border px-4 pb-3 sm:px-5">
              <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl bg-secondary p-1.5">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`h-9 shrink-0 flex-1 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition sm:text-sm ${
                      tab === t
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
              {tab === "Basic" && (
                <>
                  <Text label="Country name" value={form.name} onChange={(v) => set({ name: v })} full required />
                  <Text
                    label="ISO code"
                    placeholder="BD / GB / US"
                    value={form.iso_code ?? ""}
                    onChange={(v) => set({ iso_code: v.toUpperCase().slice(0, 2) })}
                  />
                  <Text
                    label="URL prefix"
                    placeholder="bd / uk / us"
                    value={form.url_prefix ?? ""}
                    onChange={(v) => set({ url_prefix: v })}
                    onBlur={() => set({ url_prefix: normalizePrefix(form.url_prefix ?? "") })}
                    hint={`Storefront: ${SITE_URL}/${normalizePrefix(form.url_prefix || form.code || "")}`}
                  />
                  <Text
                    label="Internal code"
                    placeholder="bd"
                    value={form.code ?? ""}
                    onChange={(v) => set({ code: v.toLowerCase() })}
                  />
                  <Text
                    label="Sort order"
                    value={String(form.sort_order ?? 0)}
                    onChange={(v) => set({ sort_order: Number(v) || 0 })}
                  />
                  <Toggle
                    label="Active"
                    checked={form.is_active ?? true}
                    onChange={(v) => set({ is_active: v })}
                  />
                  <Toggle
                    label="Default market (x-default)"
                    checked={form.is_default_market ?? false}
                    onChange={(v) => set({ is_default_market: v })}
                  />
                </>
              )}

              {tab === "Localization" && (
                <>
                  <Text
                    label="Language"
                    value={form.default_language ?? ""}
                    onChange={(v) => set({ default_language: v })}
                  />
                  <Text
                    label="Locale"
                    placeholder="en-GB"
                    value={form.locale ?? ""}
                    onChange={(v) => set({ locale: v })}
                  />
                  <Text label="Currency" value={form.currency ?? ""} onChange={(v) => set({ currency: v.toUpperCase() })} />
                  <Text
                    label="Currency symbol"
                    value={form.currency_symbol ?? ""}
                    onChange={(v) => set({ currency_symbol: v })}
                  />
                  <Text
                    label="Conversion rate (from BDT)"
                    value={String(form.fx_rate ?? 1)}
                    onChange={(v) => set({ fx_rate: Number(v) || 0 })}
                    hint="Used when regional pricing is not configured"
                  />
                  <Text label="Phone code" placeholder="+880" value={form.phone_code ?? ""} onChange={(v) => set({ phone_code: v })} />
                  <Text label="Timezone" placeholder="Asia/Dhaka" value={form.timezone ?? ""} onChange={(v) => set({ timezone: v })} />
                  <Text label="Date format" value={form.date_format ?? ""} onChange={(v) => set({ date_format: v })} />
                  <Text label="Number format" value={form.number_format ?? ""} onChange={(v) => set({ number_format: v })} />
                </>
              )}

              {tab === "SEO" && (
                <>
                  <Text label="SEO title" value={form.seo_title ?? ""} onChange={(v) => set({ seo_title: v })} full />
                  <Area
                    label="Meta description"
                    value={form.seo_description ?? ""}
                    onChange={(v) => set({ seo_description: v })}
                  />
                  <Text
                    label="Canonical base URL"
                    placeholder={SITE_URL}
                    value={form.canonical_base ?? ""}
                    onChange={(v) => set({ canonical_base: v })}
                    hint="Leave empty to use the main domain"
                  />
                  <Text
                    label="Hreflang"
                    placeholder="en-GB"
                    value={form.hreflang ?? ""}
                    onChange={(v) => set({ hreflang: v })}
                  />
                  <Text label="Open Graph title" value={form.og_title ?? ""} onChange={(v) => set({ og_title: v })} full />
                  <Area
                    label="Open Graph description"
                    value={form.og_description ?? ""}
                    onChange={(v) => set({ og_description: v })}
                  />
                  <Text label="Open Graph image URL" value={form.og_image ?? ""} onChange={(v) => set({ og_image: v })} full />
                </>
              )}

              {tab === "Storefront" && (
                <>
                  <Toggle
                    label="Storefront enabled"
                    checked={form.storefront_enabled ?? true}
                    onChange={(v) => set({ storefront_enabled: v })}
                  />
                  <Toggle
                    label="Shipping enabled"
                    checked={form.shipping_enabled ?? true}
                    onChange={(v) => set({ shipping_enabled: v })}
                  />
                  <Toggle
                    label="Cash on delivery"
                    checked={form.cod_enabled ?? false}
                    onChange={(v) => set({ cod_enabled: v })}
                  />
                  <Toggle
                    label="Online payment"
                    checked={form.online_payment_enabled ?? true}
                    onChange={(v) => set({ online_payment_enabled: v })}
                  />
                  <Toggle
                    label="Regional pricing"
                    checked={form.regional_pricing_enabled ?? false}
                    onChange={(v) => set({ regional_pricing_enabled: v })}
                  />
                </>
              )}
            </div>

            <div className="flex gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 flex-1 rounded-lg bg-sale text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving…" : form.id ? "Save changes" : "Add market"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}

function Text({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  hint,
  full,
  required,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hint?: string;
  full?: boolean;
  required?: boolean;
}) {
  return (
    <label className={`min-w-0 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        required={required}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={field}
      />
      {hint && <span className="mt-1 block truncate text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="min-w-0 text-sm sm:col-span-2">
      <span className="mb-1.5 block font-medium">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sale"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
      <span className="min-w-0 truncate font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-[hsl(var(--sale))]"
      />
    </label>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}>
          <Globe className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-extrabold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SeoBadge({ result, onClick }: { result: SeoHealth; onClick?: () => void }) {
  const tone =
    result.status === "SEO READY"
      ? "bg-emerald-500/10 text-emerald-600"
      : result.status === "ERROR"
        ? "bg-destructive/10 text-destructive"
        : "bg-amber-500/10 text-amber-600";
  const label = result.status === "SEO READY" ? "SEO Ready" : result.status === "ERROR" ? "Error" : "Needs setup";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
      title={result.missing.join(", ") || "All SEO settings configured"}
    >
      {label}
    </button>
  );
}

function RowBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
        danger
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
