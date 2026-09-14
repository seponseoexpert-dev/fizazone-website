/**
 * EPS (Easy Payment System) gateway helpers — server only.
 * Docs: GetToken -> InitializeEPS -> CheckMerchantTransactionStatus
 */

export type EpsConfig = {
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

export const EPS_DEFAULT_BASE = "https://pgapi.eps.com.bd";

export const emptyEpsConfig = (): EpsConfig => ({
  enabled: false,
  mode: "sandbox",
  base_url: EPS_DEFAULT_BASE,
  merchant_id: "",
  store_id: "",
  username: "",
  password: "",
  hash_key: "",
  success_url: "",
  fail_url: "",
  cancel_url: "",
});

export function normalizeEpsConfig(raw: unknown): EpsConfig {
  const r = (raw ?? {}) as Partial<EpsConfig>;
  const base = emptyEpsConfig();
  return {
    ...base,
    ...r,
    enabled: Boolean(r.enabled),
    mode: r.mode === "live" ? "live" : "sandbox",
    base_url: (r.base_url || EPS_DEFAULT_BASE).replace(/\/+$/, ""),
  };
}

export async function loadEpsConfig(): Promise<EpsConfig> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("payment_credentials")
    .select("config")
    .eq("provider", "eps")
    .maybeSingle();
  return normalizeEpsConfig(data?.config);
}

/**
 * Step 1-4 of the documented hash mechanism:
 * HMAC-SHA512(key = UTF8(hashKey), data = value) -> base64
 */
export async function epsHash(hashKey: string, value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(hashKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  let binary = "";
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i] as number);
  return btoa(binary);
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ErrorMessage: text.slice(0, 300) } as Record<string, unknown>;
  }
}

/** API 01 — GetToken */
export async function epsGetToken(cfg: EpsConfig): Promise<string> {
  if (!cfg.username || !cfg.password || !cfg.hash_key) {
    throw new Error("EPS credentials are not configured");
  }
  const res = await fetch(`${cfg.base_url}/v1/Auth/GetToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": await epsHash(cfg.hash_key, cfg.username),
    },
    body: JSON.stringify({ userName: cfg.username, password: cfg.password }),
  });
  const json = await readJson(res);
  const token = (json["token"] ?? json["Token"]) as string | undefined;
  if (!token) {
    throw new Error(
      String(json["errorMessage"] ?? json["ErrorMessage"] ?? "EPS token request failed"),
    );
  }
  return token;
}

export type EpsInitPayload = {
  customerOrderId: string;
  merchantTransactionId: string;
  totalAmount: number;
  transactionTypeId: number;
  ipAddress: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPostcode: string;
  customerCountry: string;
  customerPhone: string;
  productName: string;
  noOfItem: string;
  products: { name: string; qty: number; price: number; category: string }[];
};

/** API 02 — InitializeEPS */
export async function epsInitialize(cfg: EpsConfig, p: EpsInitPayload, token: string) {
  const res = await fetch(`${cfg.base_url}/v1/EPSEngine/InitializeEPS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-hash": await epsHash(cfg.hash_key, p.merchantTransactionId),
    },
    body: JSON.stringify({
      merchantId: cfg.merchant_id,
      storeId: cfg.store_id,
      CustomerOrderId: p.customerOrderId,
      merchantTransactionId: p.merchantTransactionId,
      transactionTypeId: p.transactionTypeId,
      financialEntityId: 0,
      transitionStatusId: 0,
      totalAmount: p.totalAmount,
      ipAddress: p.ipAddress,
      version: "1",
      successUrl: cfg.success_url,
      failUrl: cfg.fail_url,
      cancelUrl: cfg.cancel_url,
      customerName: p.customerName,
      customerEmail: p.customerEmail,
      CustomerAddress: p.customerAddress,
      CustomerAddress2: "",
      CustomerCity: p.customerCity,
      CustomerState: p.customerState,
      CustomerPostcode: p.customerPostcode,
      CustomerCountry: p.customerCountry,
      CustomerPhone: p.customerPhone,
      ShipmentName: p.customerName,
      ShipmentAddress: p.customerAddress,
      ShipmentCity: p.customerCity,
      ShipmentState: p.customerState,
      ShipmentPostcode: p.customerPostcode,
      ShipmentCountry: p.customerCountry,
      ValueA: p.customerOrderId,
      ValueB: "",
      ValueC: "",
      ValueD: "",
      ShippingMethod: "Courier",
      NoOfItem: p.noOfItem,
      ProductName: p.productName,
      ProductProfile: "general",
      ProductCategory: "Retail",
      ProductList: p.products.map((it) => ({
        ProductName: it.name,
        NoOfItem: String(it.qty),
        ProductProfile: "general",
        ProductCategory: it.category,
        ProductPrice: String(it.price),
      })),
    }),
  });
  const json = await readJson(res);
  const redirect = (json["RedirectURL"] ?? json["redirectURL"]) as string | undefined;
  if (!redirect) {
    throw new Error(
      String(json["ErrorMessage"] ?? json["errorMessage"] ?? "EPS could not initialize the payment"),
    );
  }
  return {
    redirectUrl: redirect,
    transactionId: String(json["TransactionId"] ?? json["transactionId"] ?? ""),
  };
}

/** API 03 — CheckMerchantTransactionStatus */
export async function epsVerify(cfg: EpsConfig, merchantTransactionId: string, token: string) {
  const url = `${cfg.base_url}/v1/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${encodeURIComponent(
    merchantTransactionId,
  )}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-hash": await epsHash(cfg.hash_key, merchantTransactionId),
    },
  });
  return await readJson(res);
}
