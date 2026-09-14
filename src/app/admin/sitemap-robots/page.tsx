"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ExternalLink, FileCode2, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { fetchCountries, type Country } from "@/lib/localization";
import { fetchSeoConfig, saveSeoConfig, SEO_BASE_URL, SEO_COUNTRY_PATHS } from "@/lib/seo";


const DEFAULT_ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${SEO_BASE_URL}/sitemap.xml\n`;

export default function AdminSitemapRobotsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [robots, setRobots] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cs, txt] = await Promise.all([fetchCountries(), fetchSeoConfig("robots_txt")]);
      setCountries(cs);
      setRobots(txt || DEFAULT_ROBOTS);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load settings");
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

  async function save() {
    setSaving(true);
    try {
      await saveSeoConfig("robots_txt", robots);
      toast.success("robots.txt saved");
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
            Sitemap &amp; Robots
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Per-country sitemap links and crawler rules
          </p>
        </header>

        {loading ? (
          <div className="grid place-items-center rounded-xl border border-border bg-card p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-base font-extrabold">Generated sitemaps</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sitemaps are generated live from your routes and products.
                </p>
              </div>
              <ul className="divide-y divide-border">
                <SitemapRow label="All pages" href={`${SEO_BASE_URL}/sitemap.xml`} />
                {countries.map((c) => (
                  <SitemapRow
                    key={c.id}
                    label={`${c.name} (${c.code.toUpperCase()})`}
                    href={`${SEO_BASE_URL}/sitemap.xml?country=${c.code}`}
                    sub={SEO_COUNTRY_PATHS[c.code] ?? "/"}
                  />
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div>
                  <h2 className="font-display text-base font-extrabold">robots.txt</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Served at {SEO_BASE_URL}/robots.txt
                  </p>
                </div>
                <FileCode2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="p-4">
                <textarea
                  value={robots}
                  onChange={(e) => setRobots(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed outline-none transition focus:border-sale"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRobots(DEFAULT_ROBOTS)}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold"
                  >
                    <RotateCcw className="h-4 w-4" /> Reset to default
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save robots.txt"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function SitemapRow({ label, href, sub }: { label: string; href: string; sub?: string }) {
  return (
    <li className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {href}
          {sub ? ` · ${sub}` : ""}
        </p>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary"
      >
        Open <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}
