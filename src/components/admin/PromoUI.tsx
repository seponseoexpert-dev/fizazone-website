import type { ReactNode } from "react";

export const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function StatTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg sm:h-10 sm:w-10 ${tone}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{label}</p>
        <p className="font-display text-base font-bold sm:text-lg">{value}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function RowBtn({
  children,
  label,
  onClick,
  danger,
  tone,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  tone?: "green";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition ${
        danger
          ? "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : tone === "green"
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10"
            : "border-border text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export function ModalShell({
  title,
  onClose,
  children,
  onSubmit,
  saving,
  submitLabel,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  saving?: boolean;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground">
            ✕
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-lg border border-border text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 flex-1 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
