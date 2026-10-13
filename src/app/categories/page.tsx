import type { Metadata } from "next";
import { CategoriesView } from "@/components/shop/CategoriesView";
import { buildMarketHreflang, SEO_BASE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shop Product Categories — Faiza Zone",
  description:
    "Browse Faiza Zone categories: men, women, kurti, panjabi, boys, t-shirts, pants and bags with flash-sale prices and fast delivery.",
  alternates: {
    canonical: `${SEO_BASE_URL}/categories`,
    languages: buildMarketHreflang("/categories"),
  },
  openGraph: {
    title: "Shop Product Categories — Faiza Zone",
    description:
      "Browse Faiza Zone categories: men, women, kurti, panjabi, boys, t-shirts, pants and bags with flash-sale prices and fast delivery.",
    type: "website",
    url: `${SEO_BASE_URL}/categories`,
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Product Categories — Faiza Zone",
    description:
      "Browse Faiza Zone categories: men, women, kurti, panjabi, boys, t-shirts, pants and bags.",
    images: ["/og-image.jpg"],
  },
};

export default function CategoriesPage() {
  return <CategoriesView />;
}
