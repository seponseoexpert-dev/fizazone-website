"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { fetchAllSettings, saveSetting } from "@/lib/settings";
import { getEpsConfig, saveEpsConfig, type EpsAdminConfig } from "@/lib/eps.functions";

export type PaymentGatewayState = {
  paypal: {
    app_id: string;
    client_id: string;
    client_secret: string;
    mode: "sandbox" | "live";
    status: "disable" | "enable";
  };
  stripe: {
    key: string;
    secret: string;
    status: "disable" | "enable";
  };
  eps: {
    username: string;
    password: string;
    merchant_id: string;
    store_id: string;
    hash_key: string;
    mode: "live" | "sandbox";
    status: "enable" | "disable";
  };
  global_remittance: {
    status: "enable" | "disable";
    western_union: "enable" | "disable";
    moneygram: "enable" | "disable";
    ria: "enable" | "disable";
    wise: "enable" | "disable";
    tap_tap_send: "enable" | "disable";
    remitly: "enable" | "disable";
    bkash_number: string;
    bkash_holder: string;
    nagad_number: string;
    nagad_holder: string;
    upay_number: string;
    upay_holder: string;
    rocket_number: string;
    rocket_holder: string;
    bank_name: string;
    bank_holder: string;
    bank_account_number: string;
    routing_swift: string;
    bank_branch: string;
    customer_instructions: string;
  };
};

const defaultState: PaymentGatewayState = {
  paypal: {
    app_id: "",
    client_id: "",
    client_secret: "",
    mode: "sandbox",
    status: "disable",
  },
  stripe: {
    key: "",
    secret: "",
    status: "disable",
  },
  eps: {
    username: "",
    password: "",
    merchant_id: "",
    store_id: "",
    hash_key: "",
    mode: "live",
    status: "enable",
  },
  global_remittance: {
    status: "enable",
    western_union: "enable",
    moneygram: "enable",
    ria: "enable",
    wise: "enable",
    tap_tap_send: "enable",
    remitly: "enable",
    bkash_number: "01410244421",
    bkash_holder: "MD RIPON",
    nagad_number: "01410244421",
    nagad_holder: "MD RIPON",
    upay_number: "01410244421",
    upay_holder: "MD RIPON",
    rocket_number: "01771888081",
    rocket_holder: "MD RIPON",
    bank_name: "Dutch-Bangla Bank",
    bank_holder: "MD RIPON",
    bank_account_number: "7017513547004",
    routing_swift: "090090109",
    bank_branch: "BHOLA",
    customer_instructions: "",
  },
};

type TabKey = "paypal" | "stripe" | "eps" | "global_remittance";

const TABS: { key: TabKey; label: string }[] = [
  { key: "paypal", label: "Paypal" },
  { key: "stripe", label: "Stripe" },
  { key: "eps", label: "EPS" },
  { key: "global_remittance", label: "Global Remittance" },
];

export function PaymentGatewayManager() {
  const [activeTab, setActiveTab] = useState<TabKey>("paypal");
  const [data, setData] = useState<PaymentGatewayState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [settings, epsCfg] = await Promise.all([
          fetchAllSettings().catch(() => ({}) as Record<string, Record<string, unknown>>),
          getEpsConfig().catch(() => null),
        ]);

        const settingsMap = settings as Record<string, Record<string, unknown>>;
        const rawGateway = (settingsMap?.payment_gateway ?? {}) as Record<string, unknown>;
        const rawPaypal = (rawGateway.paypal ?? {}) as Record<string, unknown>;
        const rawStripe = (rawGateway.stripe ?? {}) as Record<string, unknown>;
        const rawEps = (rawGateway.eps ?? {}) as Record<string, unknown>;
        const rawRemittance = (rawGateway.global_remittance ?? {}) as Record<string, unknown>;

        setData({
          paypal: {
            app_id: String(rawPaypal.app_id ?? defaultState.paypal.app_id),
            client_id: String(rawPaypal.client_id ?? defaultState.paypal.client_id),
            client_secret: String(rawPaypal.client_secret ?? defaultState.paypal.client_secret),
            mode: rawPaypal.mode === "live" ? "live" : "sandbox",
            status: rawPaypal.status === "enable" ? "enable" : "disable",
          },
          stripe: {
            key: String(rawStripe.key ?? defaultState.stripe.key),
            secret: String(rawStripe.secret ?? defaultState.stripe.secret),
            status: rawStripe.status === "enable" ? "enable" : "disable",
          },
          eps: {
            username: String(epsCfg?.username || rawEps.username || defaultState.eps.username),
            password: String(epsCfg?.password || rawEps.password || defaultState.eps.password),
            merchant_id: String(epsCfg?.merchant_id || rawEps.merchant_id || defaultState.eps.merchant_id),
            store_id: String(epsCfg?.store_id || rawEps.store_id || defaultState.eps.store_id),
            hash_key: String(epsCfg?.hash_key || rawEps.hash_key || defaultState.eps.hash_key),
            mode: (epsCfg?.mode || rawEps.mode) === "sandbox" ? "sandbox" : "live",
            status: (epsCfg?.enabled !== undefined ? (epsCfg.enabled ? "enable" : "disable") : (rawEps.status === "disable" ? "disable" : "enable")),
          },
          global_remittance: {
            status: rawRemittance.status === "disable" ? "disable" : "enable",
            western_union: rawRemittance.western_union === "disable" ? "disable" : "enable",
            moneygram: rawRemittance.moneygram === "disable" ? "disable" : "enable",
            ria: rawRemittance.ria === "disable" ? "disable" : "enable",
            wise: rawRemittance.wise === "disable" ? "disable" : "enable",
            tap_tap_send: rawRemittance.tap_tap_send === "disable" ? "disable" : "enable",
            remitly: rawRemittance.remitly === "disable" ? "disable" : "enable",
            bkash_number: String(rawRemittance.bkash_number ?? defaultState.global_remittance.bkash_number),
            bkash_holder: String(rawRemittance.bkash_holder ?? defaultState.global_remittance.bkash_holder),
            nagad_number: String(rawRemittance.nagad_number ?? defaultState.global_remittance.nagad_number),
            nagad_holder: String(rawRemittance.nagad_holder ?? defaultState.global_remittance.nagad_holder),
            upay_number: String(rawRemittance.upay_number ?? defaultState.global_remittance.upay_number),
            upay_holder: String(rawRemittance.upay_holder ?? defaultState.global_remittance.upay_holder),
            rocket_number: String(rawRemittance.rocket_number ?? defaultState.global_remittance.rocket_number),
            rocket_holder: String(rawRemittance.rocket_holder ?? defaultState.global_remittance.rocket_holder),
            bank_name: String(rawRemittance.bank_name ?? defaultState.global_remittance.bank_name),
            bank_holder: String(rawRemittance.bank_holder ?? defaultState.global_remittance.bank_holder),
            bank_account_number: String(rawRemittance.bank_account_number ?? defaultState.global_remittance.bank_account_number),
            routing_swift: String(rawRemittance.routing_swift ?? defaultState.global_remittance.routing_swift),
            bank_branch: String(rawRemittance.bank_branch ?? defaultState.global_remittance.bank_branch),
            customer_instructions: String(rawRemittance.customer_instructions ?? defaultState.global_remittance.customer_instructions),
          },
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load payment gateway settings");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all gateway settings to private admin_settings table
      await saveSetting("payment_gateway", data as unknown as Record<string, unknown>);

      // Also sync EPS credentials to payment_credentials table for server runtime
      const epsConfig: EpsAdminConfig = {
        enabled: data.eps.status === "enable",
        mode: data.eps.mode,
        base_url: "https://pgapi.eps.com.bd",
        merchant_id: data.eps.merchant_id,
        store_id: data.eps.store_id,
        username: data.eps.username,
        password: data.eps.password,
        hash_key: data.eps.hash_key,
        success_url: "",
        fail_url: "",
        cancel_url: "",
      };

      await saveEpsConfig({ data: epsConfig }).catch((e) => {
        console.warn("EPS config sync notice:", e);
      });

      toast.success("Payment Gateway settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save payment gateway settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <T extends TabKey, K extends keyof PaymentGatewayState[T]>(
    tab: T,
    field: K,
    val: PaymentGatewayState[T][K],
  ) => {
    setData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: val,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-3xl border border-[#e5e7eb] bg-white shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-7">
      {/* Header with Title and Red Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          {/* Blue Credit Card / Payment Gateway Icon */}
          <div className="flex h-7 w-8 items-center justify-center rounded border-[2px] border-[#0284c7] bg-transparent p-0.5">
            <div className="h-[2px] w-full bg-[#0284c7]" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Payment Gateway</h2>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#d90429] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b00320] active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save</span>
        </button>
      </div>

      {/* 4 Pill Tabs Bar */}
      <div className="my-6 rounded-full bg-[#f4f5f7] p-1.5">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-11 rounded-full px-4 text-center text-xs font-semibold transition-all sm:text-sm ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Subtitle */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-gray-900">
          {TABS.find((t) => t.key === activeTab)?.label}
        </h3>
      </div>

      {/* Tab 1: Paypal */}
      {activeTab === "paypal" && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              PAYPAL APP ID
            </label>
            <input
              type="text"
              placeholder="Paypal App ID"
              value={data.paypal.app_id}
              onChange={(e) => updateField("paypal", "app_id", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              PAYPAL CLIENT ID
            </label>
            <input
              type="text"
              placeholder="Paypal Client ID"
              value={data.paypal.client_id}
              onChange={(e) => updateField("paypal", "client_id", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              PAYPAL CLIENT SECRET
            </label>
            <input
              type="text"
              placeholder="Paypal Client Secret"
              value={data.paypal.client_secret}
              onChange={(e) => updateField("paypal", "client_secret", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              PAYPAL MODE
            </label>
            <div className="relative">
              <select
                value={data.paypal.mode}
                onChange={(e) =>
                  updateField("paypal", "mode", e.target.value as "sandbox" | "live")
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              PAYPAL STATUS
            </label>
            <div className="relative">
              <select
                value={data.paypal.status}
                onChange={(e) =>
                  updateField("paypal", "status", e.target.value as "disable" | "enable")
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="disable">Disable</option>
                <option value="enable">Enable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stripe */}
      {activeTab === "stripe" && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              STRIPE KEY
            </label>
            <input
              type="text"
              placeholder="Stripe Key"
              value={data.stripe.key}
              onChange={(e) => updateField("stripe", "key", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              STRIPE SECRET
            </label>
            <input
              type="text"
              placeholder="Stripe Secret"
              value={data.stripe.secret}
              onChange={(e) => updateField("stripe", "secret", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              STRIPE STATUS
            </label>
            <div className="relative">
              <select
                value={data.stripe.status}
                onChange={(e) =>
                  updateField("stripe", "status", e.target.value as "disable" | "enable")
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="disable">Disable</option>
                <option value="enable">Enable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: EPS */}
      {activeTab === "eps" && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS USERNAME (EMAIL)
            </label>
            <input
              type="text"
              placeholder="EPS Username (Email)"
              value={data.eps.username}
              onChange={(e) => updateField("eps", "username", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS PASSWORD
            </label>
            <input
              type="text"
              placeholder="EPS Password"
              value={data.eps.password}
              onChange={(e) => updateField("eps", "password", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS MERCHANT ID
            </label>
            <input
              type="text"
              placeholder="EPS Merchant ID"
              value={data.eps.merchant_id}
              onChange={(e) => updateField("eps", "merchant_id", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS STORE ID
            </label>
            <input
              type="text"
              placeholder="EPS Store ID"
              value={data.eps.store_id}
              onChange={(e) => updateField("eps", "store_id", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS HASH KEY
            </label>
            <input
              type="text"
              placeholder="EPS Hash Key"
              value={data.eps.hash_key}
              onChange={(e) => updateField("eps", "hash_key", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS MODE
            </label>
            <div className="relative">
              <select
                value={data.eps.mode}
                onChange={(e) =>
                  updateField("eps", "mode", e.target.value as "live" | "sandbox")
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="live">Live</option>
                <option value="sandbox">Sandbox</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              EPS STATUS
            </label>
            <div className="relative">
              <select
                value={data.eps.status}
                onChange={(e) =>
                  updateField("eps", "status", e.target.value as "enable" | "disable")
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Global Remittance */}
      {activeTab === "global_remittance" && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          {/* Row 1 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              GLOBAL REMITTANCE STATUS
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.status}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "status",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              WESTERN UNION
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.western_union}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "western_union",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Row 2 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              MONEYGRAM
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.moneygram}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "moneygram",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              RIA
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.ria}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "ria",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Row 3 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              WISE
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.wise}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "wise",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              TAP TAP SEND
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.tap_tap_send}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "tap_tap_send",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Row 4 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              REMITLY
            </label>
            <div className="relative">
              <select
                value={data.global_remittance.remitly}
                onChange={(e) =>
                  updateField(
                    "global_remittance",
                    "remitly",
                    e.target.value as "enable" | "disable",
                  )
                }
                className="h-11 w-full appearance-none rounded-full border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-red-500"
              >
                <option value="enable">Enable</option>
                <option value="disable">Disable</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              BKASH PERSONAL NUMBER
            </label>
            <input
              type="text"
              placeholder="01410244421"
              value={data.global_remittance.bkash_number}
              onChange={(e) => updateField("global_remittance", "bkash_number", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 5 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              BKASH ACCOUNT HOLDER NAME
            </label>
            <input
              type="text"
              placeholder="MD RIPON"
              value={data.global_remittance.bkash_holder}
              onChange={(e) => updateField("global_remittance", "bkash_holder", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              NAGAD PERSONAL NUMBER
            </label>
            <input
              type="text"
              placeholder="01410244421"
              value={data.global_remittance.nagad_number}
              onChange={(e) => updateField("global_remittance", "nagad_number", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 6 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              NAGAD ACCOUNT HOLDER NAME
            </label>
            <input
              type="text"
              placeholder="MD RIPON"
              value={data.global_remittance.nagad_holder}
              onChange={(e) => updateField("global_remittance", "nagad_holder", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              UPAY PERSONAL NUMBER
            </label>
            <input
              type="text"
              placeholder="01410244421"
              value={data.global_remittance.upay_number}
              onChange={(e) => updateField("global_remittance", "upay_number", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 7 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              UPAY ACCOUNT HOLDER NAME
            </label>
            <input
              type="text"
              placeholder="MD RIPON"
              value={data.global_remittance.upay_holder}
              onChange={(e) => updateField("global_remittance", "upay_holder", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              ROCKET PERSONAL NUMBER
            </label>
            <input
              type="text"
              placeholder="01771888081"
              value={data.global_remittance.rocket_number}
              onChange={(e) => updateField("global_remittance", "rocket_number", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 8 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              ROCKET ACCOUNT HOLDER NAME
            </label>
            <input
              type="text"
              placeholder="MD RIPON"
              value={data.global_remittance.rocket_holder}
              onChange={(e) => updateField("global_remittance", "rocket_holder", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              BANK NAME
            </label>
            <input
              type="text"
              placeholder="Dutch-Bangla Bank"
              value={data.global_remittance.bank_name}
              onChange={(e) => updateField("global_remittance", "bank_name", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 9 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              BANK A/C HOLDER NAME
            </label>
            <input
              type="text"
              placeholder="MD RIPON"
              value={data.global_remittance.bank_holder}
              onChange={(e) => updateField("global_remittance", "bank_holder", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              BANK A/C NUMBER
            </label>
            <input
              type="text"
              placeholder="7017513547004"
              value={data.global_remittance.bank_account_number}
              onChange={(e) => updateField("global_remittance", "bank_account_number", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 10 */}
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              ROUTING / SWIFT CODE
            </label>
            <input
              type="text"
              placeholder="090090109"
              value={data.global_remittance.routing_swift}
              onChange={(e) => updateField("global_remittance", "routing_swift", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              BANK BRANCH
            </label>
            <input
              type="text"
              placeholder="BHOLA"
              value={data.global_remittance.bank_branch}
              onChange={(e) => updateField("global_remittance", "bank_branch", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>

          {/* Row 11: Full Width Customer Instructions */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              CUSTOMER INSTRUCTIONS (SHOWN IN POPUP)
            </label>
            <input
              type="text"
              placeholder="Customer Instructions (shown in popup)"
              value={data.global_remittance.customer_instructions}
              onChange={(e) => updateField("global_remittance", "customer_instructions", e.target.value)}
              className="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition focus:border-red-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
