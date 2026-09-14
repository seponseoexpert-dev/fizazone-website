"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  FileDown,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";


type Status = "pending" | "approved" | "rejected";

type Review = {
  id: string;
  productId: string;
  product: string;
  image: string | null;
  customer: string;
  rating: number;
  title: string | null;
  comment: string;
  status: Status;
  createdAt: string;
};

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    approved: "bg-emerald-500/10 text-emerald-600",
    pending: "bg-amber-500/10 text-amber-600",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [rating, setRating] = useState<"all" | "5" | "4" | "3" | "2" | "1">("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, customer_name, rating, title, comment, status, created_at, products(name, images)")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows(
      (data ?? []).map((r) => {
        const p = r.products as { name?: string; images?: string[] } | null;
        return {
          id: r.id,
          productId: r.product_id,
          product: p?.name ?? "Unknown product",
          image: p?.images?.[0] ?? null,
          customer: r.customer_name,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          status: (r.status as Status) ?? "pending",
          createdAt: r.created_at,
        };
      }),
    );
  }

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("admin-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_reviews" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (rating !== "all" && r.rating !== Number(rating)) return false;
      if (!term) return true;
      return (
        r.product.toLowerCase().includes(term) ||
        r.customer.toLowerCase().includes(term) ||
        (r.title ?? "").toLowerCase().includes(term) ||
        r.comment.toLowerCase().includes(term)
      );
    });
  }, [rows, q, status, rating]);

  const stats = useMemo(() => {
    const total = rows.length;
    const avg = total ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
    return {
      total,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      avg: avg.toFixed(1),
    };
  }, [rows]);

  async function setReviewStatus(id: string, next: Status) {
    setBusy(id);
    const { error } = await supabase.from("product_reviews").update({ status: next }).eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    toast.success(`Review ${next}`);
  }

  async function remove(id: string) {
    setBusy(id);
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Review deleted");
  }

  function exportCsv() {
    const head = ["Product", "Customer", "Rating", "Title", "Comment", "Status", "Date"];
    const body = filtered.map((r) => [
      r.product,
      r.customer,
      r.rating,
      r.title ?? "",
      r.comment.replace(/\n/g, " "),
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
    ]);
    const csv = [head, ...body]
      .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "reviews.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls =
    "h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary";

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total reviews", value: stats.total, icon: MessageSquare },
            { label: "Pending", value: stats.pending, icon: Loader2 },
            { label: "Approved", value: stats.approved, icon: Check },
            { label: "Average rating", value: stats.avg, icon: Star },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search product, customer or comment"
                aria-label="Search reviews"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status | "all")}
                aria-label="Filter by status"
                className={selectCls}
              >
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value as typeof rating)}
                aria-label="Filter by rating"
                className={selectCls}
              >
                <option value="all">All ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <FileDown className="h-4 w-4" /> Export
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No reviews found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Rating</th>
                      <th className="px-4 py-3 font-semibold">Review</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-border align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {r.image ? (
                              <img
                                src={r.image}
                                alt={r.product}
                                loading="lazy"
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                            <span className="font-medium text-foreground">{r.product}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{r.customer}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Stars value={r.rating} />
                        </td>
                        <td className="max-w-sm px-4 py-3">
                          {r.title && <p className="font-medium text-foreground">{r.title}</p>}
                          <p className="text-muted-foreground">{r.comment}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Actions
                              busy={busy === r.id}
                              status={r.status}
                              onApprove={() => void setReviewStatus(r.id, "approved")}
                              onReject={() => void setReviewStatus(r.id, "rejected")}
                              onDelete={() => void remove(r.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <ul className="divide-y divide-border lg:hidden">
                {filtered.map((r) => (
                  <li key={r.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {r.image ? (
                        <img
                          src={r.image}
                          alt={r.product}
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-secondary text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{r.product}</p>
                          <StatusPill status={r.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Stars value={r.rating} />
                          <span>{r.customer}</span>
                          <span>·</span>
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        {r.title && <p className="mt-2 text-sm font-medium text-foreground">{r.title}</p>}
                        <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Actions
                            busy={busy === r.id}
                            status={r.status}
                            labels
                            onApprove={() => void setReviewStatus(r.id, "approved")}
                            onReject={() => void setReviewStatus(r.id, "rejected")}
                            onDelete={() => void remove(r.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Actions({
  busy,
  status,
  labels,
  onApprove,
  onReject,
  onDelete,
}: {
  busy: boolean;
  status: Status;
  labels?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const base =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50";
  return (
    <>
      {status !== "approved" && (
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          aria-label="Approve review"
          className={`${base} border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {labels && "Approve"}
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          aria-label="Reject review"
          className={`${base} border-border text-muted-foreground hover:bg-secondary`}
        >
          <X className="h-4 w-4" />
          {labels && "Reject"}
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        aria-label="Delete review"
        className={`${base} border-destructive/30 text-destructive hover:bg-destructive/10`}
      >
        <Trash2 className="h-4 w-4" />
        {labels && "Delete"}
      </button>
    </>
  );
}
