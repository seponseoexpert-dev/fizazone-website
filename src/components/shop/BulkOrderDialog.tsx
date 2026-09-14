import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BulkOrderSeed = {
  productId?: string;
  productName: string;
  productLink?: string;
  size?: string;
  color?: string;
  qty?: number;
  countryCode?: string;
};

export function BulkOrderDialog({
  open,
  onOpenChange,
  seed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seed: BulkOrderSeed;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    company: "",
    qty: String(Math.max(seed.qty ?? 10, 1)),
    size: seed.size ?? "",
    color: seed.color ?? "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("bulk_order_requests").insert({
      ...(seed.productId ? { product_id: seed.productId } : {}),
      product_name: seed.productName,
      product_link: seed.productLink ?? "",
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      qty: Math.max(1, Number(form.qty) || 1),
      size: form.size,
      color: form.color,
      notes: form.notes.trim(),
      country_code: seed.countryCode ?? "BD",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bulk order request sent. Our team will contact you soon.");
    onOpenChange(false);
  };

  const field =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Customize &amp; Order in bulk</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {seed.productName} — tell us your quantity and customization, our team will reply with a quote.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={field}
              placeholder="Your name *"
              value={form.customer_name}
              onChange={(e) => set("customer_name", e.target.value)}
            />
            <input
              className={field}
              placeholder="Phone *"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
            <input
              className={field}
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <input
              className={field}
              placeholder="Company / Brand"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
            <input
              className={field}
              placeholder="Quantity"
              inputMode="numeric"
              value={form.qty}
              onChange={(e) => set("qty", e.target.value)}
            />
            <input
              className={field}
              placeholder="Size"
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Color"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
            />
          </div>
          <textarea
            className="min-h-24 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-foreground"
            placeholder="Customization details (logo, print, packaging, deadline...)"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-bold text-background disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Send bulk request
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
