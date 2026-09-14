import type { Metadata } from "next";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = {
  title: "My Wishlist — Faiza Zone",
  description: "Save your favourite Faiza Zone products and come back to buy them any time.",
  openGraph: {
    title: "My Wishlist — Faiza Zone",
    description: "Save your favourite Faiza Zone products and come back to buy them any time.",
    type: "website",
  },
};

export default function WishlistPage() {
  return <WishlistView />;
}
