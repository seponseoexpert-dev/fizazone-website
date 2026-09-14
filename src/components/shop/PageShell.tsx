import type { ReactNode } from "react";
import { socialMeta } from "@/lib/social";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Sections";
import { BottomNav } from "@/components/shop/BottomNav";

export function PageShell({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />
      <main>
        <h1 className="sr-only">{title}</h1>
        {subtitle && <span className="sr-only">{subtitle}</span>}
        <div className={`shop-container py-5 sm:py-8 ${wide ? "" : "max-w-3xl"}`}>{children}</div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}


export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-base [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground sm:[&_h2]:text-xl [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
      {children}
    </div>
  );
}

export function seoHead(title: string, description: string, path: string, robots?: string) {
  return () => socialMeta({ title, description, path, robots });
}
