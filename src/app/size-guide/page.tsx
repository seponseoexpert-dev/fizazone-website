import type { Metadata } from "next";
import { SizeGuideView } from "./SizeGuideView";

export const metadata: Metadata = {
  title: "Size Guide — Faiza Zone",
  description:
    "Men, women and juniors size charts with chest, waist, length and shoe conversions for Faiza Zone.",
  openGraph: {
    title: "Size Guide — Faiza Zone",
    description:
      "Men, women and juniors size charts with chest, waist, length and shoe conversions for Faiza Zone.",
    type: "website",
  },
};

export default function SizeGuidePage() {
  return <SizeGuideView />;
}
