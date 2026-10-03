import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartView } from "@/app/cart/CartView";
import { CheckoutView } from "@/app/checkout/CheckoutView";
import AboutPage from "@/app/about/page";
import { ContactView } from "@/app/contact/ContactView";
import { SizeGuideView } from "@/app/size-guide/SizeGuideView";
import ReturnPolicyPage from "@/app/return-policy/page";
import { TrackOrderView } from "@/app/track-order/TrackOrderView";
import { WishlistView } from "@/app/wishlist/WishlistView";
import { AccountView } from "@/app/account/AccountView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = slug[0]?.toLowerCase();

  switch (page) {
    case "cart":
      return { title: "Your Cart — Faiza Zone", robots: { index: false } };
    case "checkout":
      return { title: "Checkout — Faiza Zone", robots: { index: false } };
    case "about":
      return { title: "About Us — Faiza Zone" };
    case "contact":
      return { title: "Contact Us — Faiza Zone" };
    case "size-guide":
      return { title: "Size Guide — Faiza Zone" };
    case "return-policy":
      return { title: "Return & Refund Policy — Faiza Zone" };
    case "track-order":
      return { title: "Track Order — Faiza Zone" };
    case "wishlist":
      return { title: "My Wishlist — Faiza Zone", robots: { index: false } };
    case "account":
      return { title: "My Account — Faiza Zone", robots: { index: false } };
    default:
      return { title: "Faiza Zone" };
  }
}

export default async function MarketCatchAllPage({
  params,
}: {
  params: Promise<{ market: string; slug: string[] }>;
}) {
  const { market, slug } = await params;
  const page = slug[0]?.toLowerCase();

  switch (page) {
    case "cart":
      return <CartView />;
    case "checkout":
      return <CheckoutView />;
    case "about":
      return <AboutPage />;
    case "contact":
      return <ContactView />;
    case "size-guide":
      return <SizeGuideView />;
    case "return-policy":
      return <ReturnPolicyPage />;
    case "track-order":
      return <TrackOrderView />;
    case "wishlist":
      return <WishlistView />;
    case "account":
      return <AccountView />;
    default:
      redirect(`/${market}`);
  }
}
