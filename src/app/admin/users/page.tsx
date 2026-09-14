"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import {
  ADMIN_ROLES,
  COUNTRY_OPTIONS,
  deleteAdminUser,
  fetchAdminUsers,
  roleLabel,
  saveAdminUser,
  type AdminRole,
  type AdminUser,
} from "@/lib/content";


const field =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

type Form = Partial<AdminUser>;

const emptyForm: Form = {
  email: "",
  full_name: "",
  role: "editor",
  country_code: "bd",
  is_active: true,
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminRole>("all");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await fetchAdminUsers());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load admin users");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (roleFilter === "all" || r.role === roleFilter) &&
        (!q || r.email.toLowerCase().includes(q) || r.full_name.toLowerCase().includes(q)),
    );
  }, [rows, query, roleFilter]);

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

  async function toggle(row: AdminUser) {
    try {
      await saveAdminUser({ ...row, is_active: !row.is_active });
      toast.success(row.is_active ? "Access disabled" : "Access enabled");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(row: AdminUser) {
    if (!window.confirm(`Remove ${row.email}?`)) return;
    try {
      await deleteAdminUser(row.id);
      toast.success("Admin user removed");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveAdminUser(form);
      toast.success(form.id ? "Admin user updated" : "Admin user added");
      setForm(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl xl:text-3xl">
              Admin Users
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Staff accounts, roles and the market each manager is responsible for
            </p>
          </div>
          <button
            onClick={() => setForm({ ...emptyForm })}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add admin user
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {ADMIN_ROLES.map((r) => (
            <div
              key={r.value}
              className="card-elevated rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-sale/10 text-sale">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{r.label}</p>
                  <p className="font-display text-lg font-bold">
                    {rows.filter((x) => x.role === r.value).length}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{r.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email…"
                className={`${field} pl-9`}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | AdminRole)}
              className={`${field} sm:w-56`}
            >
              <option value="all">All roles</option>
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No admin users yet.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-green/20 text-xs font-bold text-brand-forest">
                              {(r.full_name || r.email).slice(0, 1).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{r.full_name || "—"}</p>
                              <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{roleLabel(r.role)}</td>
                        <td className="p-3 uppercase text-muted-foreground">
                          {r.role === "country_manager" ? (r.country_code ?? "—") : "All"}
                        </td>
                        <td className="p-3">
                          <StatusBadge active={r.is_active} />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <RowBtn label="Toggle status" onClick={() => toggle(r)}>
                              <Power className="h-4 w-4" />
                            </RowBtn>
                            <RowBtn label="Edit" onClick={() => setForm(r)}>
                              <Pencil className="h-4 w-4" />
                            </RowBtn>
                            <RowBtn label="Delete" danger onClick={() => remove(r)}>
                              <Trash2 className="h-4 w-4" />
                            </RowBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border lg:hidden">
                {filtered.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-semibold">
                          <UserCog className="h-4 w-4 text-sale" />
                          <span className="truncate">{r.full_name || r.email}</span>
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{r.email}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {roleLabel(r.role)} ·{" "}
                          {r.role === "country_manager"
                            ? (r.country_code ?? "—").toUpperCase()
                            : "All countries"}
                        </p>
                      </div>
                      <StatusBadge active={r.is_active} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => toggle(r)}
                        className="h-9 flex-1 rounded-lg border border-border text-xs font-semibold"
                      >
                        {r.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => setForm(r)}
                        className="h-9 flex-1 rounded-lg border border-border text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(r)}
                        className="h-9 flex-1 rounded-lg border border-destructive/40 text-xs font-semibold text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4">
          <form
            onSubmit={submit}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-5 sm:max-w-lg sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                {form.id ? "Edit admin user" : "Add admin user"}
              </h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Full name
                </span>
                <input
                  value={form.full_name ?? ""}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className={field}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Email (account login)
                </span>
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={field}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Role</span>
                <select
                  value={form.role ?? "editor"}
                  onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
                  className={field}
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              {form.role === "country_manager" && (
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Assigned country
                  </span>
                  <select
                    value={form.country_code ?? "bd"}
                    onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                    className={field}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-[11px] text-muted-foreground">
                    This manager only sees and edits data for the selected country.
                  </span>
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 accent-[var(--sale)]"
                />
                Active
              </label>
            </div>

            <div className="mt-5 flex gap-3">
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
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sale text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RowBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
        danger
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
