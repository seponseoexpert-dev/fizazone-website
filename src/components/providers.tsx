"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CountryProvider } from "@/lib/country";
import { AccountProvider } from "@/lib/account";
import { CartProvider } from "@/components/shop/cart";
import { Toaster } from "@/components/ui/sonner";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import type { SiteBranding } from "@/lib/site-branding-server";

export function Providers({
  children,
  initialBranding,
}: {
  children: ReactNode;
  initialBranding?: SiteBranding;
}) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });
    if (initialBranding) {
      client.setQueryData(["site-branding"], initialBranding);
    }
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CountryProvider>
        <AccountProvider>
          <CartProvider>
            <DynamicFavicon />
            {children}
            <Toaster position="top-center" />
          </CartProvider>
        </AccountProvider>
      </CountryProvider>
    </QueryClientProvider>
  );
}
