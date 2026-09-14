/**
 * Backwards-compatible wrappers around the market layer (`src/lib/markets.ts`).
 * Everything here is DB-driven: Admin → Countries decides what exists.
 */
import { marketToSetting, type CountryCode, type CountrySetting } from "@/lib/country";
import { resolveMarket, useActiveMarkets } from "@/lib/markets";

/** Raw list of URL prefixes for markets marked active in the admin panel. */
export function useActiveCountryCodes() {
  const { markets, loaded } = useActiveMarkets();
  return { codes: markets.map((m) => m.prefix), isLoading: !loaded, loaded };
}

/** Active markets mapped to storefront country settings. */
export function useActiveCountries(): CountrySetting[] {
  const { markets } = useActiveMarkets();
  return markets.map(marketToSetting);
}

/** True when a given market storefront is enabled. `null` while unknown. */
export function useIsCountryActive(code: CountryCode): boolean | null {
  const { markets, loaded } = useActiveMarkets();
  if (!loaded) return null;
  return Boolean(resolveMarket(markets, code));
}
