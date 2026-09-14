import type { Metadata } from "next";
import { ContactView } from "./ContactView";

export const metadata: Metadata = {
  title: "Contact Us — Faiza Zone",
  description: "Call, email or message Faiza Zone. Support available 7 days a week, 9am to 9pm.",
  openGraph: {
    title: "Contact Us — Faiza Zone",
    description: "Call, email or message Faiza Zone. Support available 7 days a week, 9am to 9pm.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactView />;
}
