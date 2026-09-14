"use server";

import { z } from "zod";
import { headers } from "next/headers";

export type EpsAdminConfig = {
  enabled: boolean;
  mode: "sandbox" | "live";
  base_url: string;
  merchant_id: string;
  store_id: string;
  username: string;
  password: string;
  hash_key: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
};

const configSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["sandbox", "live"]),
  base_url: z.string().max(200),
  merchant_id: z.string().max(120),
  store_id: z.string().max(120),
  username: z.string().max(160),
  password: z.string().max(200),
  hash_key: z.string().max(400),
  success_url: z.string().max(300),
  fail_url: z.string().max(300),
  cancel_url: z.string().max(300),
});

export async function getEpsConfig(_?: unknown): Promise<EpsAdminConfig> {
  const { loadEpsConfig } = await import("@/lib/eps.server");
  return (await loadEpsConfig()) as EpsAdminConfig;
}

export async function saveEpsConfig(
  input: { data: EpsAdminConfig } | EpsAdminConfig,
) {
  const data = "data" in input ? input.data : input;
  const parsed = configSchema.parse(data);
  const { normalizeEpsConfig, EPS_DEFAULT_BASE } = await import("@/lib/eps.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const config = normalizeEpsConfig({ ...parsed, base_url: parsed.base_url || EPS_DEFAULT_BASE });
  const { error } = await supabaseAdmin.from("payment_credentials").upsert(
    { provider: "eps", config: config as never, updated_at: new Date().toISOString() },
    { onConflict: "provider" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function testEpsConnection(_?: unknown) {
  const { loadEpsConfig, epsGetToken } = await import("@/lib/eps.server");
  try {
    const token = await epsGetToken(await loadEpsConfig());
    return { ok: true as const, message: `Token received (${token.slice(0, 12)}…)` };
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/** Storefront: start an EPS payment for an already-created order. */
export async function startEpsPayment(
  input: { data: { order_id: string } } | { order_id: string },
) {
  const data = "data" in input ? input.data : input;
  const parsed = z.object({ order_id: z.string().uuid() }).parse(data);

  const { loadEpsConfig, epsGetToken, epsInitialize } = await import("@/lib/eps.server");
  const cfg = await loadEpsConfig();
  if (!cfg.enabled) throw new Error("Online payment is currently unavailable");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, customer_name, phone, address, total, order_items(name, qty, unit_price)")
    .eq("id", parsed.order_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found");

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  const merchantTransactionId = `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
  const items = (order.order_items ?? []) as { name: string; qty: number; unit_price: number }[];

  const withReturn = (url: string, fallback: string) => {
    const base = url || `${origin}${fallback}`;
    return `${base}${base.includes("?") ? "&" : "?"}mtid=${merchantTransactionId}`;
  };

  const runtime = {
    ...cfg,
    success_url: withReturn(cfg.success_url, "/payment/eps"),
    fail_url: withReturn(cfg.fail_url, "/payment/eps"),
    cancel_url: withReturn(cfg.cancel_url, "/payment/eps"),
  };

  await supabaseAdmin.from("payment_transactions").insert({
    order_id: order.id as string,
    provider: "eps",
    merchant_transaction_id: merchantTransactionId,
    amount: Number(order.total),
    status: "Initiated",
  });

  const ipAddress =
    headersList.get("cf-connecting-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0";

  const token = await epsGetToken(runtime);
  const init = await epsInitialize(
    runtime,
    {
      customerOrderId: `FZ-${String(order.id).slice(0, 8).toUpperCase()}`,
      merchantTransactionId,
      totalAmount: Number(order.total),
      transactionTypeId: 1,
      ipAddress,
      customerName: order.customer_name as string,
      customerEmail: "customer@faizazone.com",
      customerAddress: String(order.address).slice(0, 200),
      customerCity: "Dhaka",
      customerState: "Dhaka",
      customerPostcode: "1200",
      customerCountry: "BD",
      customerPhone: order.phone as string,
      productName: items[0]?.name ?? "Faiza Zone Order",
      noOfItem: String(items.reduce((n, i) => n + i.qty, 0) || 1),
      products: items.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: Number(i.unit_price),
        category: "Retail",
      })),
    },
    token,
  );

  await supabaseAdmin
    .from("payment_transactions")
    .update({
      eps_transaction_id: init.transactionId,
      status: "Pending",
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_transaction_id", merchantTransactionId);

  return { redirectUrl: init.redirectUrl, merchantTransactionId };
}

/** Storefront: verify an EPS transaction after the gateway redirects back. */
export async function verifyEpsPayment(
  input: { data: { merchant_transaction_id: string } } | { merchant_transaction_id: string },
) {
  const data = "data" in input ? input.data : input;
  const parsed = z.object({ merchant_transaction_id: z.string().min(6).max(60) }).parse(data);

  const { loadEpsConfig, epsGetToken, epsVerify } = await import("@/lib/eps.server");
  const cfg = await loadEpsConfig();
  const token = await epsGetToken(cfg);
  const result = await epsVerify(cfg, parsed.merchant_transaction_id, token);
  const status = String(result["Status"] ?? result["status"] ?? "Unknown");
  const amount = Number(result["TotalAmount"] ?? 0);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: tx } = await supabaseAdmin
    .from("payment_transactions")
    .update({
      status,
      eps_transaction_id: String(result["EpsTransactionId"] ?? "") || null,
      financial_entity: String(result["FinancialEntity"] ?? "") || null,
      raw: result as never,
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_transaction_id", parsed.merchant_transaction_id)
    .select("order_id")
    .maybeSingle();

  if (tx?.order_id) {
    await supabaseAdmin
      .from("orders")
      .update({ status: status.toLowerCase() === "success" ? "Processing" : "Cancelled" })
      .eq("id", tx.order_id as string);
  }

  return {
    status,
    amount,
    paid: status.toLowerCase() === "success",
    epsTransactionId: String(result["EpsTransactionId"] ?? ""),
    financialEntity: String(result["FinancialEntity"] ?? ""),
    message: String(result["ErrorMessage"] ?? ""),
  };
}
