"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shop/PageShell";

const info = [
  { icon: Phone, label: "Hotline", value: "+880 1700-000000" },
  { icon: Mail, label: "Email", value: "support@faizazone.com" },
  { icon: MapPin, label: "Store", value: "House 12, Road 5, Dhanmondi, Dhaka" },
  { icon: Clock, label: "Hours", value: "Saturday – Friday, 9am – 9pm" },
];

const field =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

export function ContactView() {
  const [sending, setSending] = useState(false);

  return (
    <PageShell title="Contact Us" subtitle="We usually reply within a couple of hours." wide>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-3">
          {info.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sale/10 text-sale">
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              (e.target as HTMLFormElement).reset();
              toast.success("Message sent! We'll get back to you shortly.");
            }, 600);
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="c-name">
              Full name *
            </label>
            <input id="c-name" required className={field} placeholder="Your full name" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="c-email">
              Email or mobile *
            </label>
            <input id="c-email" required className={field} placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="c-msg">
              Message *
            </label>
            <textarea
              id="c-msg"
              required
              rows={5}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition focus:border-sale"
              placeholder="How can we help?"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="h-12 w-full rounded-lg bg-sale text-sm font-bold uppercase tracking-wide text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
