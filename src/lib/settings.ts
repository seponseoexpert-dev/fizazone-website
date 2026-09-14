import { supabase } from "@/integrations/supabase/client";
import {
  getAdminSettings,
  saveAdminSetting,
} from "@/lib/admin-settings.functions";

export type SettingsMap = Record<string, Record<string, unknown>>;

export const SETTING_KEYS = [
  "company",
  "site",
  "mail",
  "social",
  "shipping",
  "notification",
  "analytics",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const ADMIN_SETTING_KEYS = [
  "sms_gateway",
  "payment_gateway",
  "shipping_intl",
  "mail",
  "otp",
  "notification",
] as const;

const PRIVATE_KEYS = new Set<string>(ADMIN_SETTING_KEYS);

export const isPrivateSettingKey = (key: string) => PRIVATE_KEYS.has(key);

/** Public storefront settings only (site_settings table). */
export async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const map: SettingsMap = {};
  for (const row of data ?? []) {
    map[row.key] = (row.value ?? {}) as Record<string, unknown>;
  }
  return map;
}

/** Public + private settings — admin panel only. */
export async function fetchAllSettings(): Promise<SettingsMap> {
  const [pub, priv] = await Promise.all([
    fetchSettings(),
    getAdminSettings({}).catch(() => ({}) as SettingsMap),
  ]);
  return { ...pub, ...priv };
}

export async function saveSetting(key: string, value: Record<string, unknown>) {
  if (isPrivateSettingKey(key)) {
    await saveAdminSetting({ data: { key, value } });
    return;
  }
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
}
