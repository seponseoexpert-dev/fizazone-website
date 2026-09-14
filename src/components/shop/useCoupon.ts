import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppliedCoupon = {
  code: string;
  name: string;
  discount: number;
  discount_type: "fixed" | "percentage";
  min_order: number;
};

const KEY = "fiza-coupon";

export function couponDiscount(c: AppliedCoupon | null, subtotal: number) {
  if (!c) return 0;
  if (subtotal < c.min_order) return 0;
  const raw = c.discount_type === "percentage" ? (subtotal * c.discount) / 100 : c.discount;
  return Math.min(Math.round(raw), subtotal);
}

/** Validates promo codes against the coupons table and persists the applied one. */
export function useCoupon(subtotal: number) {
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setApplied(JSON.parse(raw) as AppliedCoupon);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (c: AppliedCoupon | null) => {
    setApplied(c);
    try {
      if (c) localStorage.setItem(KEY, JSON.stringify(c));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  const apply = useCallback(
    async (input: string) => {
      const code = input.trim().toLowerCase();
      setError(null);
      if (!code) {
        setError("Enter a promo code");
        return false;
      }
      setLoading(true);
      try {
        const { data, error: dbError } = await supabase
          .from("coupons")
          .select("name, code, discount, discount_type, min_order, start_date, end_date, is_active")
          .eq("code", code)
          .maybeSingle();

        if (dbError) throw dbError;
        if (!data || !data.is_active) {
          setError("Invalid promo code");
          return false;
        }
        const now = Date.now();
        if (new Date(data.start_date).getTime() > now) {
          setError("This promo code is not active yet");
          return false;
        }
        if (new Date(data.end_date).getTime() < now) {
          setError("This promo code has expired");
          return false;
        }
        if (subtotal < Number(data.min_order)) {
          setError(`Minimum order ৳${Number(data.min_order).toFixed(0)} required`);
          return false;
        }
        persist({
          code: data.code,
          name: data.name,
          discount: Number(data.discount),
          discount_type: data.discount_type === "percentage" ? "percentage" : "fixed",
          min_order: Number(data.min_order),
        });
        return true;
      } catch {
        setError("Could not check the code. Try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [subtotal],
  );

  const clearCoupon = useCallback(() => {
    persist(null);
    setError(null);
  }, []);

  return { applied, error, loading, apply, clearCoupon, discount: couponDiscount(applied, subtotal) };
}
