import type { Metadata } from "next";
import { CategoriesView } from "@/components/shop/CategoriesView";

export const metadata: Metadata = {
  title: "Shop Product Categories — Faiza Zone",
  description:
    "Browse Faiza Zone categories: men, women, kurti, panjabi, boys, t-shirts, pants and bags with flash-sale prices and fast delivery.",
  openGraph: {
    title: "Shop Product Categories — Faiza Zone",
    description:
      "Browse Faiza Zone categories: men, women, kurti, panjabi, boys, t-shirts, pants and bags with flash-sale prices and fast delivery.",
    type: "website",
  },
};

export default function CategoriesPage() {
  return <CategoriesView />;
}
