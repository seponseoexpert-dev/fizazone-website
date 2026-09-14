import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = {
  title: "Your Cart — Faiza Zone",
  description:
    "Review your Faiza Zone bag, update quantities, apply a promo code and checkout with fast delivery.",
  robots: "noindex",
};

export default function CartPage() {
  return <CartView />;
}
