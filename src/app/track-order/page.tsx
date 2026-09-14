import type { Metadata } from "next";
import { TrackOrderView } from "./TrackOrderView";

export const metadata: Metadata = {
  title: "Track Your Order — Faiza Zone",
  description:
    "Enter your order ID and mobile number to see live delivery status of your Faiza Zone order.",
  openGraph: {
    title: "Track Your Order — Faiza Zone",
    description:
      "Enter your order ID and mobile number to see live delivery status of your Faiza Zone order.",
    type: "website",
  },
};

export default function TrackOrderPage() {
  return <TrackOrderView />;
}
