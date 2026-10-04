"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ShippingZones, type ShippingZone } from "@/components/admin/ShippingZones";
import { NotificationAlerts, type AlertMap } from "@/components/admin/NotificationAlerts";
import { AnalyticsList, type AnalyticsItem } from "@/components/admin/AnalyticsList";
import { SlidersManager, type SliderItem } from "@/components/admin/SlidersManager";
import { PagesManager, type PageItem } from "@/components/admin/PagesManager";
import { ProviderTabs, type ProviderValues } from "@/components/admin/ProviderTabs";
import { EpsGateway } from "@/components/admin/EpsGateway";

import { PaymentGatewayManager } from "@/components/admin/PaymentGatewayManager";

import { isAdmin } from "@/lib/admin-products";
import { fetchAllSettings, saveSetting, type SettingsMap } from "@/lib/settings";
import { SECTIONS, SECTION_GROUPS, type Section } from "@/lib/settings-schema";


const field =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AdminShell>
      }
    >
      <AdminSettingsContent />
    </Suspense>
  );
}

function AdminSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<string>(
    initialTab && SECTIONS.some((s) => s.key === initialTab) ? initialTab : "company"
  );
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SettingsMap>({});

  const section: Section = useMemo(
    () => SECTIONS.find((s) => s.key === active) ?? (SECTIONS[0] as Section),
    [active],
  );

  const load = useCallback(async () => {
    try {
      setData(await fetchAllSettings());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const ok = userData.user ? await isAdmin(userData.user.id) : false;
      setAllowed(ok);
      if (!ok) {
        router.push("/admin/dashboard" );
        return;
      }
      await load();
    })();
  }, [load, router]);

  const values = data[section.key] ?? {};

  function setValue(name: string, value: unknown) {
    setData((prev) => ({
      ...prev,
      [section.key]: { ...(prev[section.key] ?? {}), [name]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSetting(section.key, values);

      if (section.key === "site" || section.key === "theme") {
        const logoUrl = (values.logo_url as string) || "";
        const faviconUrl = (values.favicon_url as string) || "";
        const footerLogoUrl = (values.footer_logo_url as string) || logoUrl;
        const siteTitle = (values.site_title as string) || "";

        if (typeof window !== "undefined") {
          try {
            const current = JSON.parse(localStorage.getItem("fz_site_branding") || "{}");
            const updated = {
              ...current,
              ...(logoUrl ? { logo_url: logoUrl } : {}),
              ...(faviconUrl ? { favicon_url: faviconUrl } : {}),
              ...(footerLogoUrl ? { footer_logo_url: footerLogoUrl } : {}),
              ...(siteTitle ? { site_title: siteTitle } : {}),
            };
            localStorage.setItem("fz_site_branding", JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent("fz_site_branding_updated"));
          } catch {}
          if (faviconUrl) {
            import("@/lib/site-branding").then(({ updateFaviconInDocument }) => {
              updateFaviconInDocument(faviconUrl);
            });
          }
        }
      }

      toast.success(`${section.label} settings saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (allowed === null) {
    return (
      <AdminShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        <nav className="flex flex-wrap items-center gap-1.5 text-lg font-semibold text-foreground sm:text-xl">
          <span>Dashboard</span>
          <span className="text-muted-foreground">/</span>
          <span>Settings</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{section.label}</span>
        </nav>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Section list */}
          <aside className="min-w-0 rounded-2xl border border-border bg-background p-2 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div className="relative hidden p-1 lg:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search settings"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-sale"
              />
            </div>

            {/* Mobile / tablet: horizontal chips */}
            <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:hidden">
              {SECTIONS.map((s) => {
                const isActive = s.key === section.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setActive(s.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-sale/10 text-sale"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <s.icon className="h-4 w-4 shrink-0" />
                    <span className="whitespace-nowrap">{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop: grouped list */}
            <div className="hidden lg:block">
              {SECTION_GROUPS.map((group) => {
                const items = SECTIONS.filter(
                  (s) =>
                    s.group === group &&
                    s.label.toLowerCase().includes(query.trim().toLowerCase()),
                );
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((s) => {
                        const isActive = s.key === section.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setActive(s.key)}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? "bg-sale/10 text-sale"
                                : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <s.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>


          {/* Form */}
          {section.key === "payment_gateway" ? (
            <div className="min-w-0">
              <PaymentGatewayManager />
            </div>
          ) : (
            <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
              <header className="border-b border-border px-4 py-4 sm:px-6">
                <h1 className="text-base font-semibold text-foreground sm:text-lg">
                  {section.label}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  {section.description}
                </p>
              </header>

              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSave();
                  }}
                >
                <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6">

                  {section.fields.map((f) => {
                    const raw = values[f.name];
                    const key = `${section.key}-${f.name}`;
                    const wrap = f.full || f.type === "textarea" ? "sm:col-span-2" : "";

                    if (f.type === "image") {
                      return (
                        <div key={key} className={wrap}>
                          <ImageUploader
                            label={f.label}
                            folder="settings"
                            value={typeof raw === "string" ? raw : ""}
                            onChange={(url) => setValue(f.name, url)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "zones") {
                      return (
                        <div key={key} className="sm:col-span-2">
                          <ShippingZones
                            value={(Array.isArray(raw) ? raw : []) as ShippingZone[]}
                            onChange={(next) => setValue(f.name, next)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "alerts") {
                      return (
                        <div key={key} className="sm:col-span-2">
                          <NotificationAlerts
                            value={(raw && typeof raw === "object" ? raw : {}) as AlertMap}
                            onChange={(next) => setValue(f.name, next)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "analytics") {
                      return (
                        <div key={key} className="sm:col-span-2">
                          <AnalyticsList
                            value={(Array.isArray(raw) ? raw : []) as AnalyticsItem[]}
                            onChange={(next) => setValue(f.name, next)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "sliders") {
                      return (
                        <div key={key} className="sm:col-span-2">
                          <SlidersManager
                            value={(Array.isArray(raw) ? raw : []) as SliderItem[]}
                            onChange={(next) => setValue(f.name, next)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "providers") {
                      return (
                        <div key={key} className="min-w-0 sm:col-span-2">
                          <ProviderTabs
                            providers={f.providers ?? []}
                            value={(raw && typeof raw === "object" ? raw : {}) as ProviderValues}
                            onChange={(next) => setValue(f.name, next)}
                            custom={{ eps: <EpsGateway /> }}
                          />
                        </div>
                      );
                    }




                    if (f.type === "pages") {
                      return (
                        <div key={key} className="sm:col-span-2">
                          <PagesManager
                            value={(Array.isArray(raw) ? raw : []) as PageItem[]}
                            onChange={(next) => setValue(f.name, next)}
                          />
                        </div>
                      );
                    }

                    if (f.type === "switch") {
                      return (
                        <label
                          key={key}
                          className={`flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 ${wrap}`}
                        >
                          <span className="text-sm font-medium text-foreground">{f.label}</span>
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-sale"
                            checked={Boolean(raw)}
                            onChange={(e) => setValue(f.name, e.target.checked)}
                          />
                        </label>
                      );
                    }

                    if (f.type === "color") {
                      const val = typeof raw === "string" && raw ? raw : "#e11d48";
                      return (
                        <div key={key} className={wrap}>
                          <label
                            htmlFor={key}
                            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {f.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              id={key}
                              type="color"
                              className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
                              value={val}
                              onChange={(e) => setValue(f.name, e.target.value)}
                            />
                            <input
                              type="text"
                              className={field}
                              value={val}
                              onChange={(e) => setValue(f.name, e.target.value)}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(f.name === "secondary_color"
                              ? ["#1f1f39", "#111827", "#334155", "#1e293b", "#3f3f46", "#52525b", "#64748b"]
                              : ["#e11d48", "#f23e14", "#f97316", "#f59e0b", "#22c55e", "#0ea5e9", "#6366f1", "#a855f7"]
                            ).map((c) => (
                              <button
                                key={c}
                                type="button"
                                aria-label={`Use ${c}`}
                                onClick={() => setValue(f.name, c)}
                                style={{ backgroundColor: c }}
                                className={`h-7 w-7 rounded-full border-2 transition ${
                                  val.toLowerCase() === c ? "border-foreground" : "border-transparent"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                      );
                    }



                    return (
                      <div key={key} className={wrap}>
                        <label
                          htmlFor={key}
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {f.label}
                          {f.required && <span className="ml-1 text-sale">*</span>}
                        </label>

                        {f.type === "textarea" ? (
                          <textarea
                            id={key}
                            rows={4}
                            required={f.required}
                            placeholder={f.placeholder}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sale"
                            value={typeof raw === "string" ? raw : ""}
                            onChange={(e) => setValue(f.name, e.target.value)}
                          />
                        ) : f.type === "select" ? (
                          <select
                            id={key}
                            className={field}
                            value={typeof raw === "string" ? raw : ""}
                            onChange={(e) => setValue(f.name, e.target.value)}
                          >
                            {f.options?.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={key}
                            type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                            required={f.required}
                            placeholder={f.placeholder}
                            className={field}
                            value={raw === null || raw === undefined ? "" : String(raw)}
                            onChange={(e) =>
                              setValue(
                                f.name,
                                f.type === "number"
                                  ? e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                  : e.target.value,
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="h-11 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-secondary"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sale px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save changes
                  </button>
                </div>
              </form>
            )}
          </section>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
