import { useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";

import { ImageUploader } from "@/components/admin/ImageUploader";

export type SliderItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  active: boolean;
};

const field =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

const blank = (): SliderItem => ({
  id: crypto.randomUUID(),
  title: "",
  subtitle: "",
  image: "",
  link: "",
  active: true,
});

export function SlidersManager({
  value,
  onChange,
}: {
  value: SliderItem[];
  onChange: (next: SliderItem[]) => void;
}) {
  const [draft, setDraft] = useState<SliderItem | null>(null);

  function commit() {
    if (!draft || !draft.title.trim()) return;
    const exists = value.some((v) => v.id === draft.id);
    onChange(exists ? value.map((v) => (v.id === draft.id ? draft : v)) : [...value, draft]);
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">Sliders</h3>
        <button
          type="button"
          onClick={() => setDraft(blank())}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-sale px-3 sm:px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Slider
        </button>
      </div>

      {draft && (
        <div className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2">
          <input
            className={field}
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <input
            className={field}
            placeholder="Subtitle"
            value={draft.subtitle}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          />
          <input
            className={field}
            placeholder="Link (e.g. /categories)"
            value={draft.link}
            onChange={(e) => setDraft({ ...draft, link: e.target.value })}
          />
          <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-border px-3">
            <span className="text-sm font-medium">Active</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-sale"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
          </label>
          <div className="sm:col-span-2">
            <ImageUploader
              label="Slider image"
              folder="sliders"
              value={draft.image}
              onChange={(url) => setDraft({ ...draft, image: url })}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={commit}
              className="h-10 rounded-lg bg-sale px-5 text-sm font-semibold text-primary-foreground"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="h-10 rounded-lg border border-border px-5 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="hidden grid-cols-[80px_1fr_120px_160px] gap-3 border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
          <span>Image</span>
          <span>Title</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {value.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No Data Found!</p>
          </div>
        ) : (
          value.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[80px_1fr_120px_160px] sm:items-center"
            >
              <div className="h-14 w-20 overflow-hidden rounded-lg bg-muted">
                {row.image ? (
                  <img src={row.image} alt={row.title} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.subtitle || row.link}</p>
              </div>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  row.active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                }`}
              >
                {row.active ? "Active" : "Inactive"}
              </span>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDraft(row)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold hover:border-sale hover:text-sale"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v.id !== row.id))}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-semibold text-sale hover:border-sale"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
