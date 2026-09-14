"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Languages, Loader2, Plus, Save, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { fetchCountries, type Country } from "@/lib/localization";
import {
  fetchSeoMeta,
  saveSeoMeta,
  SEO_BASE_URL,
  SEO_COUNTRY_PATHS,
  type HreflangAlt,
  type SeoMetaRow,
} from "@/lib/seo";


const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

export default function AdminHreflangPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<SeoMetaRow[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [alts, setAlts] = useState<HreflangAlt[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meta, cs] = await Promise.all([fetchSeoMeta(), fetchCountries()]);
      setRows(meta);
      setCountries(cs);
      setSelectedId((cur) => cur ?? meta[0]?.id ?? null);
      const first = meta[0];
      if (first) setAlts(first.hreflang);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load pages");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  function select(row: SeoMetaRow) {
    setSelectedId(row.id);
    setAlts(row.hreflang);
  }

  function autoGenerate() {
    if (!selected) return;
    const siblings = rows.filter(
      (r) => r.page_type === selected.page_type && r.page_key === selected.page_key,
    );
    const generated: HreflangAlt[] = siblings.map((s) => {
      const country = countries.find((c) => c.code === s.country_code);
      const lang = country?.default_language || "en";
      const path = s.slug || SEO_COUNTRY_PATHS[s.country_code] || "/";
      return {
        hreflang: `${lang}-${s.country_code.toUpperCase()}`,
        href: s.canonical_url || `${SEO_BASE_URL}${path}`,
      };
    });
    generated.push({ hreflang: "x-default", href: `${SEO_BASE_URL}/` });
    setAlts(generated);
    toast.success("Alternates generated — review then save");
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      await saveSeoMeta({ ...selected, hreflang: alts.filter((a) => a.hreflang && a.href) });
      toast.success("Hreflang alternates saved");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <AdminShell>
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
            Hreflang Manager
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Map every page to its country and language alternate URLs
          </p>
        </header>

        {loading ? (
          <div className="grid place-items-center rounded-xl border border-border bg-card p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Add pages in SEO Settings first.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="rounded-xl border border-border bg-card">
              <p className="border-b border-border p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Pages
              </p>
              <ul className="max-h-[420px] overflow-y-auto p-2">
                {rows.map((r) => {
                  const active = r.id === selectedId;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => select(r)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-sale/10 font-semibold text-sale"
                            : "text-foreground/80 hover:bg-secondary"
                        }`}
                      >
                        <Languages className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {r.page_label || r.page_key}
                        </span>
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {r.country_code}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
              {selected && (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-base font-extrabold">
                        {selected.page_label || selected.page_key}
                      </p>
                      <p className="text-[11px] uppercase text-muted-foreground">
                        {selected.page_type} · {selected.country_code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={autoGenerate}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sale px-4 text-sm font-semibold text-sale"
                    >
                      <Wand2 className="h-4 w-4" /> Auto-generate
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {alts.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        No alternates yet. Auto-generate or add one manually.
                      </p>
                    )}
                    {alts.map((a, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                        <input
                          value={a.hreflang}
                          onChange={(e) =>
                            setAlts(
                              alts.map((x, xi) =>
                                xi === i ? { ...x, hreflang: e.target.value } : x,
                              ),
                            )
                          }
                          placeholder="en-GB"
                          className={field}
                        />
                        <input
                          value={a.href}
                          onChange={(e) =>
                            setAlts(
                              alts.map((x, xi) => (xi === i ? { ...x, href: e.target.value } : x)),
                            )
                          }
                          placeholder="https://faizazone.com/uk"
                          className={field}
                        />
                        <button
                          type="button"
                          aria-label="Remove alternate"
                          onClick={() => setAlts(alts.filter((_, xi) => xi !== i))}
                          className="grid h-10 w-10 place-items-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setAlts([...alts, { hreflang: "", href: "" }])}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold"
                    >
                      <Plus className="h-4 w-4" /> Add alternate
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save alternates"}
                    </button>
                  </div>

                  <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
{alts
  .filter((a) => a.hreflang && a.href)
  .map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`)
  .join("\n") || "<!-- no alternates -->"}
                  </pre>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
