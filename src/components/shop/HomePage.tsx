import { Header } from "@/components/shop/Header";
import {
  Categories,
  Features,
  Footer,
  Hero,
  PromoStrip,
  SectionHeader,
  WinterBanner,
} from "@/components/shop/Sections";
import { ProductGrid } from "@/components/shop/ProductCard";
import { BottomNav } from "@/components/shop/BottomNav";
import { trendy, ethnic, popular, flashSale } from "./data";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />
      <main>
        <Hero />
        <Categories />
        <PromoStrip />

        <section className="shop-container py-5 sm:py-8">
          <SectionHeader title="Trendy Now" action="View all" />
          <ProductGrid products={trendy} />
        </section>

        <WinterBanner />

        <section className="shop-container py-5 sm:py-8">
          <SectionHeader title="Ethnic Collection" action="View all" />
          <ProductGrid products={ethnic} />
        </section>

        <section className="shop-container py-5 sm:py-8">
          <SectionHeader title="Flash Sale" />
          <ProductGrid products={flashSale} />
        </section>

        <section className="shop-container py-5 sm:py-8">
          <SectionHeader title="Most Popular" />
          <ProductGrid products={popular} />
        </section>

        <Features />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
