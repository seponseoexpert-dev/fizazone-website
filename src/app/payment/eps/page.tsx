import type { Metadata } from "next";
import { EpsPaymentView } from "./EpsPaymentView";

export const metadata: Metadata = {
  title: "Payment status — Faiza Zone",
  description: "Your Faiza Zone EPS payment status and order confirmation.",
  robots: "noindex",
};

export default function EpsPaymentPage() {
  return <EpsPaymentView />;
}
