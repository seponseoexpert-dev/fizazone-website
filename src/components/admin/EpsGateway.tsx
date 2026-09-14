"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, PlugZap, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  getEpsConfig as getEpsConfigFn,
  saveEpsConfig as saveEpsConfigFn,
  testEpsConnection as testEpsConnectionFn,
  type EpsAdminConfig,
} from "@/lib/eps.functions";

const field =
  "h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

const blank: EpsAdminConfig = {
  enabled: false,
  mode: "sandbox",
  base_url: "https://pgapi.eps.com.bd",
  merchant_id: "",
  store_id: "",
  username: "",
  password: "",
  hash_key: "",
  success_url: "",
  fail_url: "",
  cancel_url: "",
};

export function EpsGateway() {
  const load = getEpsConfigFn;
  const save = saveEpsConfigFn;
  const test = testEpsConnectionFn;

  const [cfg, setCfg] = useState<EpsAdminConfig>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await load({});
        setCfg({ ...blank, ...data });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load EPS settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const set = <K extends keyof EpsAdminConfig>(k: K, v: EpsAdminConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    try {
      await save({ data: cfg });
      toast.success("EPS gateway settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save EPS settings");
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const res = await test({});
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-border">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-3 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sale/10 text-sale">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">EPS Payment Gateway (Bangladesh)</p>
            <p className="text-xs text-muted-foreground">
              Card, bKash, Nagad, Rocket and bank payments via eps.com.bd. Credentials are stored
              admin-only and never exposed to the storefront.
            </p>
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 sm:shrink-0">
          <span className="text-sm font-medium text-foreground">Enable EPS</span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-sale"
            checked={cfg.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="eps-mode">Mode</label>
          <select
            id="eps-mode"
            className={field}
            value={cfg.mode}
            onChange={(e) => set("mode", e.target.value as EpsAdminConfig["mode"])}
          >
            <option value="sandbox">Sandbox (test)</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-base">API base URL</label>
          <input
            id="eps-base"
            className={field}
            placeholder="https://pgapi.eps.com.bd"
            value={cfg.base_url}
            onChange={(e) => set("base_url", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-merchant">Merchant ID</label>
          <input
            id="eps-merchant"
            className={field}
            placeholder="094980ee-xxxx-xxxx"
            value={cfg.merchant_id}
            onChange={(e) => set("merchant_id", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-store">Store ID</label>
          <input
            id="eps-store"
            className={field}
            placeholder="35b518f6-xxxx-xxxx"
            value={cfg.store_id}
            onChange={(e) => set("store_id", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-user">API username</label>
          <input
            id="eps-user"
            className={field}
            autoComplete="off"
            value={cfg.username}
            onChange={(e) => set("username", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-pass">API password</label>
          <div className="flex items-center gap-2">
            <input
              id="eps-pass"
              className={field}
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              value={cfg.password}
              onChange={(e) => set("password", e.target.value)}
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
              aria-label={reveal ? "Hide secrets" : "Show secrets"}
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="eps-hash">Hash key (x-hash secret)</label>
          <input
            id="eps-hash"
            className={field}
            type={reveal ? "text" : "password"}
            autoComplete="off"
            placeholder="SFNLQHJlY2lwZXdhbGEjYTc3Zi1..."
            value={cfg.hash_key}
            onChange={(e) => set("hash_key", e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            x-hash = Base64( HMAC-SHA512( hash key, userName / merchantTransactionId ) ) — generated
            automatically on the server for every request.
          </p>
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-success">Success URL</label>
          <input
            id="eps-success"
            className={field}
            placeholder="https://faizazone.com/payment/eps"
            value={cfg.success_url}
            onChange={(e) => set("success_url", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="eps-fail">Fail URL</label>
          <input
            id="eps-fail"
            className={field}
            placeholder="https://faizazone.com/payment/eps"
            value={cfg.fail_url}
            onChange={(e) => set("fail_url", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="eps-cancel">Cancel URL</label>
          <input
            id="eps-cancel"
            className={field}
            placeholder="https://faizazone.com/payment/eps"
            value={cfg.cancel_url}
            onChange={(e) => set("cancel_url", e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Leave blank to use the built-in /payment/eps return page.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => void onTest()}
          disabled={testing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          Test connection
        </button>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-sale px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save EPS settings
        </button>
      </div>
    </div>
  );
}
