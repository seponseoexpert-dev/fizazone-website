"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Account = { name: string; email: string; phone?: string };
export type SavedAddress = { name: string; phone: string; address: string; city: string };
export type OrderRecord = {
  id: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  total: number;
  items: number;
};
export type WishlistItem = { id: string; slug?: string; name: string; image: string; price: number };

type AccountContextValue = {
  user: Account | null;
  orders: OrderRecord[];
  address: SavedAddress | null;
  wishlist: WishlistItem[];
  login: (user: Account) => void;
  logout: () => void;
  saveAddress: (address: SavedAddress) => void;
  toggleWishlist: (item: WishlistItem) => void;
  inWishlist: (id: string) => boolean;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const KEY = "faiza-account";

const demoOrders: OrderRecord[] = [
  { id: "FZ-10245", date: "12 Aug 2026", status: "Delivered", total: 1850, items: 3 },
  { id: "FZ-10312", date: "02 Sep 2026", status: "Shipped", total: 940, items: 1 },
  { id: "FZ-10388", date: "14 Sep 2026", status: "Processing", total: 2460, items: 4 },
];

type Persisted = { user: Account | null; address: SavedAddress | null; wishlist: WishlistItem[] };

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>({ user: null, address: null, wishlist: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as Persisted);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const value = useMemo<AccountContextValue>(
    () => ({
      user: state.user,
      address: state.address,
      wishlist: state.wishlist,
      orders: state.user ? demoOrders : [],
      login: (user) => setState((s) => ({ ...s, user })),
      logout: () => setState((s) => ({ ...s, user: null })),
      saveAddress: (address) => setState((s) => ({ ...s, address })),
      inWishlist: (id) => state.wishlist.some((w) => w.id === id),
      toggleWishlist: (item) =>
        setState((s) => ({
          ...s,
          wishlist: s.wishlist.some((w) => w.id === item.id)
            ? s.wishlist.filter((w) => w.id !== item.id)
            : [...s.wishlist, item],
        })),
    }),
    [state],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
}
