"use client";

import { useEffect } from "react";
import { useCountry } from "@/lib/country";

export function MarketSync({ prefix, isShoppable }: { prefix: string; isShoppable: boolean }) {
  const { country, setCountry } = useCountry();

  useEffect(() => {
    if (isShoppable && country.code !== prefix) {
      setCountry(prefix);
    }
  }, [isShoppable, prefix, country.code, setCountry]);

  return null;
}
