"use client";

import { useState } from "react";
import { CheckCircle2, Circle, PackageSearch, Truck } from "lucide-react";
import { PageShell } from "@/components/shop/PageShell";
import { trackOrder } from "@/lib/orders.functions";

const steps = [
  { title: "Order placed", note: "We received your order" },
  { title: "Packed", note: "Item packed at our Dhaka warehouse" },
  { title: "Shipped", note: "Handed over to the courier" },
  { title: "Out for delivery", note: "Rider is on the way" },
  { title: "Delivered", note: "Enjoy your purchase" },
];

const STAGE_BY_STATUS: Record<string, number> = {
  Processing: 0,
  Packed: 1,
  Shipped: 2,
  "Out for delivery": 3,
  Delivered: 4,
  Cancelled: 0,
};

export function TrackOrderView() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    id: string;
    stage: number;
    total: number;
    status: string;
    items: { name: string; qty: number; size: string; color: string; unit_price: number }[];
  } | null>(null);

  return (
    <PageShell title="Track Your Order" subtitle="Live status of every Faiza Zone parcel.">
      <form
        className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setMessage(null);
          try {
            const res = await trackOrder({ code: orderId.trim(), phone: phone.trim() });
            if (!res.found) {
              setResult(null);
              setMessage("No order found for this ID and mobile number.");
            } else {
              setResult({
                id: res.order.code,
                stage: STAGE_BY_STATUS[res.order.status] ?? 0,
                total: res.order.total,
                status: res.order.status,
                items: res.order.items,
              });
            }
          } catch {
            setResult(null);
            setMessage("Could not check the order right now. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <input
          required
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order ID (e.g. FZ-10245)"
          aria-label="Order ID"
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Mobile number"
          aria-label="Mobile number"
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-sale px-6 text-sm font-bold uppercase tracking-wide text-primary-foreground"
        >
          {loading ? "Checking…" : "Track"}
        </button>
      </form>

      {result ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-sale" />
              <p className="font-display text-lg font-bold">Order {result.id}</p>
            </div>
            <span className="rounded-full bg-sale/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sale">
              {result.status}
            </span>
          </div>
          <ol className="mt-5 space-y-5">
            {steps.map((step, i) => {
              const done = i <= result.stage;
              return (
                <li key={step.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-sale" />
                    ) : (
                      <Circle className="h-5 w-5 text-border" />
                    )}
                    {i < steps.length - 1 && (
                      <span className={`mt-1 w-px flex-1 ${done ? "bg-sale" : "bg-border"}`} />
                    )}
                  </div>
                  <div className="pb-1">
                    <p
                      className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 border-t border-border pt-4">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {result.items.map((it, i) => (
                <li key={i}>
                  {it.qty} × {it.name}
                  {it.size ? ` · ${it.size}` : ""}
                  {it.color ? ` · ${it.color}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-bold">Total ৳{result.total.toFixed(0)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid place-items-center rounded-xl border border-dashed border-border p-10 text-center">
          <PackageSearch className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {message ?? "Enter your order ID and mobile number to see the delivery timeline."}
          </p>
        </div>
      )}
    </PageShell>
  );
}
