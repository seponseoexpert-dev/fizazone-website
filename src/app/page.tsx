import type { Metadata } from "next";
import { HomePage } from "@/components/shop/HomePage";
import { getMarkets } from "@/lib/markets.functions";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Faiza Zone — Fashion, Footwear & Accessories Online";
  const description =
    "Shop trending kurti, panjabi, hoodies, sneakers and accessories at Faiza Zone. Flash sales up to 50% off with fast worldwide delivery.";

  try {
    const markets = await getMarkets();
    const global = markets.find((m) => m.isDefault);
    return {
      title: global?.seoTitle || title,
      description: global?.seoDescription || description,
      openGraph: {
        title: global?.seoTitle || title,
        description: global?.seoDescription || description,
        type: "website",
        siteName: "Faiza Zone",
      },
      twitter: {
        card: "summary_large_image",
        site: "@faizazone",
      },
    };
  } catch {
    return {
      title,
      description,
    };
  }
}

export default function RootPage() {
  return <HomePage />;
}
