import { Search } from "lucide-react";

function Counter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span className={`text-[11px] font-medium ${over ? "text-destructive" : "text-muted-foreground"}`}>
      {len}/{max}
    </span>
  );
}

/**
 * Reusable SEO block: title + meta description with counters and a read-only
 * preview of the market URLs. The product slug is canonical and lives in
 * Product Details — country content never creates its own slug.
 */
export function SeoSettings({
  title,
  slug,
  description,
  onTitle,
  onDescription,
  markets = ["bd"],
  baseUrl = "https://faizazone.com",
}: {
  title: string;
  slug: string;
  description: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  /** Market prefixes to preview, e.g. ["bd","uk","us"] */
  markets?: string[];
  baseUrl?: string;
}) {
  const field =
    "h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none transition focus:border-sale";
  const path = slug || "your-product";

  return (
    <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-bold uppercase tracking-wide">SEO Settings</h4>
      </div>

      <div className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 flex items-center justify-between gap-3">
            <span className="font-medium">SEO Title</span>
            <Counter value={title} max={60} />
          </span>
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Custom SEO title..."
            className={field}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center justify-between gap-3">
            <span className="font-medium">Meta Description</span>
            <Counter value={description} max={160} />
          </span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            placeholder="Custom meta description..."
            className="w-full resize-y rounded-2xl border border-border bg-background p-3 text-sm outline-none transition focus:border-sale"
          />
        </label>

        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Market URL preview (auto-generated from the product slug)
          </p>
          <ul className="space-y-1">
            {markets.map((m) => (
              <li key={m} className="break-all text-[11px] text-muted-foreground">
                {baseUrl}/{m}/product/{path}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Canonical, hreflang, og:url, JSON-LD and sitemap entries are generated automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
