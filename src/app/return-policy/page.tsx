import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/shop/PageShell";

export const metadata: Metadata = {
  title: "Return & Refund Policy — Faiza Zone",
  description:
    "7-day easy returns, exchange rules, refund timeline and non-returnable items at Faiza Zone.",
  openGraph: {
    title: "Return & Refund Policy — Faiza Zone",
    description:
      "7-day easy returns, exchange rules, refund timeline and non-returnable items at Faiza Zone.",
    type: "website",
  },
};

export default function ReturnPolicyPage() {
  return (
    <PageShell title="Return & Refund Policy" subtitle="Simple, 7 days, no drama.">
      <Prose>
        <h2>Return window</h2>
        <p>
          You can request a return within <strong>7 days</strong> of delivery. Items must be unused,
          unwashed and returned with original tags and packaging.
        </p>
        <h2>How to request</h2>
        <ul>
          <li>Message us on WhatsApp or use the Contact page with your order ID.</li>
          <li>Share a short video or photo of the item and the issue.</li>
          <li>We confirm within 24 hours and arrange pickup or share a return address.</li>
        </ul>
        <h2>Refund timeline</h2>
        <ul>
          <li>Cash on delivery orders: refund via bKash / Nagad within 3–5 working days.</li>
          <li>Card / Stripe orders: refunded to the original card in 5–10 working days.</li>
          <li>Delivery charges are non-refundable unless the item was wrong or damaged.</li>
        </ul>
        <h2>Non-returnable items</h2>
        <ul>
          <li>Innerwear, socks and cosmetics.</li>
          <li>Clearance and final-sale products.</li>
          <li>Items damaged by customer use or washing.</li>
        </ul>
        <h2>Exchanges</h2>
        <p>
          Size exchange is free once per order inside Bangladesh, subject to stock availability.
        </p>
      </Prose>
    </PageShell>
  );
}
