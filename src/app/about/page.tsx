import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/shop/PageShell";

export const metadata: Metadata = {
  title: "About Us — Faiza Zone",
  description:
    "Learn about Faiza Zone: a Bangladesh-based fashion brand shipping quality apparel and accessories worldwide.",
  openGraph: {
    title: "About Us — Faiza Zone",
    description:
      "Learn about Faiza Zone: a Bangladesh-based fashion brand shipping quality apparel and accessories worldwide.",
    type: "website",
  },
};

const stats = [
  { value: "120K+", label: "Happy customers" },
  { value: "3", label: "Countries served" },
  { value: "48h", label: "Average dispatch" },
  { value: "4.8/5", label: "Customer rating" },
];

export default function AboutPage() {
  return (
    <PageShell
      title="About Faiza Zone"
      subtitle="Everyday fashion made in Bangladesh, delivered worldwide."
      wide
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Prose>
          <p>
            Faiza Zone started in Dhaka with one simple goal: make well-made, honestly priced
            clothing that people actually want to wear every day. What began as a small studio
            producing a handful of kurtis and panjabis now serves customers across Bangladesh, the
            United States and the United Kingdom.
          </p>
          <h2>What we stand for</h2>
          <ul>
            <li>Fabric first — every batch is checked before it reaches our shelves.</li>
            <li>Fair pricing — no inflated tags, no fake discounts.</li>
            <li>Fast, trackable delivery with a clear 7-day return window.</li>
            <li>Real people on support, seven days a week.</li>
          </ul>
          <h2>Our promise</h2>
          <p>
            If something does not fit or does not feel right, we make it easy to exchange or return.
            Your trust is worth far more to us than a single sale.
          </p>
        </Prose>
        <div className="grid grid-cols-2 gap-3 self-start">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl font-extrabold text-sale">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
