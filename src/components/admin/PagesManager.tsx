import { useState } from "react";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";

import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { RichText } from "@/lib/rich-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PageItem = {
  id: string;
  title: string;
  slug: string;
  status: "active" | "inactive";
  menu_section: string;
  menu_template: string;
  image: string;
  description: string;
};

const field =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

const MENU_SECTIONS = [
  { value: "legal", label: "Legal Section" },
  { value: "quick_links", label: "Quick Links" },
  { value: "help", label: "Help & Support" },
  { value: "footer", label: "Footer" },
  { value: "none", label: "Not in menu" },
];

const MENU_TEMPLATES = [
  { value: "", label: "--" },
  { value: "default", label: "Default" },
  { value: "full_width", label: "Full width" },
  { value: "sidebar", label: "With sidebar" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const blank = (): PageItem => ({
  id: crypto.randomUUID(),
  title: "",
  slug: "",
  status: "active",
  menu_section: "legal",
  menu_template: "",
  image: "",
  description: "",
});

export function PagesManager({
  value,
  onChange,
}: {
  value: PageItem[];
  onChange: (next: PageItem[]) => void;
}) {
  const [draft, setDraft] = useState<PageItem | null>(null);
  const [preview, setPreview] = useState<PageItem | null>(null);

  function commit() {
    if (!draft || !draft.title.trim()) return;
    const item = { ...draft, slug: draft.slug.trim() || slugify(draft.title) };
    const exists = value.some((v) => v.id === item.id);
    onChange(exists ? value.map((v) => (v.id === item.id ? item : v)) : [...value, item]);
    setDraft(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">Pages</h3>
        <button
          type="button"
          onClick={() => setDraft(blank())}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-sale px-3 sm:px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Page
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {value.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  No Data Found
                </td>
              </tr>
            )}
            {value.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    onView={() => setPreview(p)}
                    onEdit={() => setDraft(p)}
                    onDelete={() => onChange(value.filter((v) => v.id !== p.id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {value.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Showing 1 to {value.length} of {value.length} entries
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {value.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No Data Found
          </p>
        )}
        {value.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">/{p.slug || slugify(p.title)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-3">
              <RowActions
                onView={() => setPreview(p)}
                onEdit={() => setDraft(p)}
                onDelete={() => onChange(value.filter((v) => v.id !== p.id))}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add / edit dialog */}
      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
          <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle className="text-base sm:text-lg">Pages</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6">
              <div>
                <Label>Title *</Label>
                <input
                  className={field}
                  value={draft.title}
                  placeholder="About Us"
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>

              <div>
                <Label>Status *</Label>
                <div className="flex h-11 items-center gap-6">
                  {(["active", "inactive"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-sm capitalize">
                      <input
                        type="radio"
                        className="h-4 w-4 accent-sale"
                        checked={draft.status === s}
                        onChange={() => setDraft({ ...draft, status: s })}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Menu section *</Label>
                <select
                  className={field}
                  value={draft.menu_section}
                  onChange={(e) => setDraft({ ...draft, menu_section: e.target.value })}
                >
                  {MENU_SECTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Menu template</Label>
                <select
                  className={field}
                  value={draft.menu_template}
                  onChange={(e) => setDraft({ ...draft, menu_template: e.target.value })}
                >
                  {MENU_TEMPLATES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>Slug</Label>
                <input
                  className={field}
                  value={draft.slug}
                  placeholder={slugify(draft.title) || "about-us"}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploader
                  label="Image"
                  folder="pages"
                  value={draft.image}
                  onChange={(url) => setDraft({ ...draft, image: url })}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Description *</Label>
                <RichTextEditor
                  value={draft.description}
                  onChange={(html) => setDraft({ ...draft, description: html })}
                  placeholder="Write the page content…"
                  minHeight={220}
                />
              </div>
            </div>
          )}

          <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Close
            </button>
            <button
              type="button"
              onClick={commit}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sale px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview?.image && (
            <img
              src={preview.image}
              alt={preview.title}
              className="w-full rounded-xl border border-border object-cover"
              loading="lazy"
            />
          )}
          <RichText value={preview?.description ?? ""} className="text-sm text-muted-foreground" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: PageItem["status"] }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
        status === "active"
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

function RowActions({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const base =
    "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onView} className={`${base} border-sale/40 text-sale hover:bg-sale/10`}>
        <Eye className="h-3.5 w-3.5" /> View
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={`${base} border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10`}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={`${base} border-destructive/40 text-destructive hover:bg-destructive/10`}
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    </div>
  );
}
