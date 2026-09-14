"use client";

import { Link } from "@/components/ui/link";
import { Heart } from "lucide-react";
import { PageShell } from "@/components/shop/PageShell";
import { useAccount } from "@/lib/account";
import { useCountry } from "@/lib/country";
import { productLinkProps, useMarketPrefix } from "@/lib/market-link";

export function WishlistView() {
  const { wishlist, toggleWishlist } = useAccount();
  const { format } = useCountry();
  const market = useMarketPrefix();

  return (
    <PageShell title="My Wishlist" subtitle="Everything you saved for later." wide>
      {wishlist.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-border p-12 text-center">
          <Heart className="h-9 w-9 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You have not saved anything yet.</p>
          <Link
            to="/categories"
            className="mt-4 rounded-lg bg-sale px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((w) => (
            <div key={w.id} className="rounded-xl border border-border bg-card p-3">
              <Link {...productLinkProps(market, w)}>
                <img
                  src={w.image}
                  alt={w.name}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </Link>
              <p className="mt-2 line-clamp-2 text-xs font-medium">{w.name}</p>
              <p className="text-sm font-bold text-sale">{format(w.price)}</p>
              <button
                type="button"
                onClick={() => toggleWishlist(w)}
                className="mt-2 w-full rounded-md border border-border py-1.5 text-[11px] font-medium hover:bg-secondary"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
