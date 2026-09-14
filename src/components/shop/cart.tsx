"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  /** SEO slug, used for market-aware product links */
  slug?: string;
  name: string;
  image: string;
  price: number;
  /** Original price before discount, used for the "You save" line */
  mrp?: number;
  qty: number;
  size?: string;
  color?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fiza-cart";

export const lineKey = (i: CartItem) => `${i.id}|${i.size ?? ""}|${i.color ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
      add: (item, qty = 1) =>
        setItems((prev) => {
          const next = { ...item, qty } as CartItem;
          const key = lineKey(next);
          const found = prev.find((p) => lineKey(p) === key);
          if (found) return prev.map((p) => (lineKey(p) === key ? { ...p, qty: p.qty + qty } : p));
          return [...prev, next];
        }),
      setQty: (key, qty) =>
        setItems((prev) =>
          prev.flatMap((p) => (lineKey(p) === key ? (qty <= 0 ? [] : [{ ...p, qty }]) : [p])),
        ),
      remove: (key) => setItems((prev) => prev.filter((p) => lineKey(p) !== key)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
