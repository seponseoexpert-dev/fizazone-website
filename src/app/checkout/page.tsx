import type { Metadata } from "next";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = {
  title: "Checkout — Faiza Zone",
  description:
    "Cash on delivery or online payment — complete your Faiza Zone order with fast delivery across Bangladesh.",
  robots: "noindex",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
