import type { Metadata } from "next";
import { AccountView } from "./AccountView";

export const metadata: Metadata = {
  title: "My Account — Faiza Zone",
  description:
    "Sign in to Faiza Zone to view order history, manage your saved address and your wishlist.",
  robots: "noindex",
};

export default function AccountPage() {
  return <AccountView />;
}
