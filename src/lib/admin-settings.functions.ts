"use server";

import { z } from "zod";

export type AdminSettingKey =
  | "sms_gateway"
  | "payment_gateway"
  | "shipping_intl"
  | "mail"
  | "otp"
  | "notification";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type AdminSettingsMap = Record<string, Record<string, Json>>;

/** Read every private setting. */
export async function getAdminSettings(
  _input?: Record<string, unknown>,
): Promise<AdminSettingsMap> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("admin_settings").select("key,value");
  if (error) throw new Error(error.message);
  const map: AdminSettingsMap = {};
  for (const row of data ?? []) {
    map[row.key as string] = (row.value ?? {}) as Record<string, Json>;
  }
  return map;
}

/** Save one private setting section. */
export async function saveAdminSetting(
  input: { data: { key: string; value: Record<string, unknown> } } | { key: string; value: Record<string, unknown> },
) {
  const data = "data" in input ? input.data : input;
  const parsed = z
    .object({
      key: z.string().min(1),
      value: z.record(z.string(), z.any()),
    })
    .parse(data);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("admin_settings")
    .upsert({ key: parsed.key, value: parsed.value as never }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export type PublicShippingZone = Record<string, Json>;

/**
 * Storefront-safe subset of the private shipping settings: rates, currency and
 * delivery estimates only — never gateway keys or credentials.
 */
export async function getPublicShippingZones(
  _input?: Record<string, unknown>,
): Promise<PublicShippingZone[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_settings")
    .select("value")
    .eq("key", "shipping_intl")
    .maybeSingle();
  if (error) throw new Error(error.message);

  const zones = ((data?.value as Record<string, unknown> | null)?.["zones"] ?? []) as unknown[];
  if (!Array.isArray(zones)) return [];

  const ALLOWED = new Set([
    "code",
    "name",
    "currency",
    "symbol",
    "rate",
    "tax_rate",
    "phone_code",
    "payments",
    "standard_cost",
    "standard_min",
    "standard_max",
    "express_cost",
    "express_min",
    "express_max",
    "free_over",
    "enabled",
  ]);

  return zones
    .filter((z): z is Record<string, Json> => Boolean(z) && typeof z === "object")
    .map((z) => Object.fromEntries(Object.entries(z).filter(([k]) => ALLOWED.has(k))));
}
