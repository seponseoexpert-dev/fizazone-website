"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CountryProvider } from "@/lib/country";
import { AccountProvider } from "@/lib/account";
import { CartProvider } from "@/components/shop/cart";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CountryProvider>
        <AccountProvider>
          <CartProvider>
            {children}
            <Toaster position="top-center" />
          </CartProvider>
        </AccountProvider>
      </CountryProvider>
    </QueryClientProvider>
  );
}
