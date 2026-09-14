import { useState } from "react";
import { Bell, Mail, MessageSquare } from "lucide-react";

export type AlertChannel = "mail" | "sms" | "push";

export type AlertMessage = { enabled: boolean; text: string };
export type AlertMap = Record<string, Record<string, AlertMessage>>;

const MESSAGES = [
  { key: "order_pending", label: "Order Pending Message", fallback: "Your order is successfully placed." },
  { key: "order_confirmed", label: "Order Confirmation Message", fallback: "Your order is confirmed." },
  { key: "order_on_the_way", label: "Order On The Way Message", fallback: "Your order is on the way." },
  { key: "order_delivered", label: "Order Delivered Message", fallback: "Your order is successfully delivered." },
  { key: "order_canceled", label: "Order Canceled Message", fallback: "Your order is canceled." },
  { key: "order_rejected", label: "Order Rejected Message", fallback: "Your order is rejected." },
  { key: "admin_new_order", label: "Admin And Manager New Order Message", fallback: "You have a new order." },
] as const;

const TABS: { key: AlertChannel; label: string; icon: typeof Mail }[] = [
  { key: "mail", label: "Mail", icon: Mail },
  { key: "sms", label: "Sms", icon: MessageSquare },
  { key: "push", label: "Push Notification", icon: Bell },
];

export function NotificationAlerts({
  value,
  onChange,
}: {
  value: AlertMap;
  onChange: (next: AlertMap) => void;
}) {
  const [tab, setTab] = useState<AlertChannel>("mail");
  const channel = value?.[tab] ?? {};

  function update(key: string, patch: Partial<AlertMessage>) {
    const current = channel[key] ?? { enabled: false, text: "" };
    onChange({
      ...value,
      [tab]: { ...channel, [key]: { ...current, ...patch } },
    });
  }

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 text-xs font-semibold transition sm:h-12 sm:px-3 sm:text-sm ${
                isActive
                  ? "border-sale bg-sale text-primary-foreground"
                  : "border-border bg-background text-foreground/80 hover:bg-secondary"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <header className="border-b border-border px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-foreground sm:text-base">
            {TABS.find((t) => t.key === tab)?.label} Notification Messages
          </h3>
        </header>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          {MESSAGES.map((m) => {
            const item = channel[m.key] ?? { enabled: false, text: "" };
            return (
              <div key={m.key} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-xs font-medium text-foreground sm:text-sm">{m.label}</span>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-8 cursor-pointer appearance-none rounded-full bg-muted transition-colors checked:bg-sale"
                      checked={item.enabled}
                      onChange={(e) => update(m.key, { enabled: e.target.checked })}
                      aria-label={`${m.label} enabled`}
                    />
                    <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                      {item.enabled ? "On" : "Off"}
                    </span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={item.text}
                  placeholder={m.fallback}
                  onChange={(e) => update(m.key, { text: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-sale"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
