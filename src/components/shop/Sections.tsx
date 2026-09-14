"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/components/ui/link";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Pause,
  Play,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Plus,
  Minus,
  Send,
  Phone,
} from "lucide-react";
import heroWomen from "@/assets/hero-style-women.jpg";
import heroMen from "@/assets/hero-style-men.jpg";
import heroJuniors from "@/assets/hero-style-juniors.jpg";
import winterImg from "@/assets/winter-collection.jpg";
import promoMen from "@/assets/promo-men.jpg";
import promoWomen from "@/assets/promo-women.jpg";
import promoKids from "@/assets/promo-kids.jpg";
import { categories } from "./data";
import { useSiteBanners, useSitePromotions } from "@/lib/site-content";
import { useActiveCountries } from "@/lib/active-countries";
import { getImageSrc } from "@/lib/utils";

const slides = [
  {
    image: getImageSrc(heroWomen),
    alt: "Trending now — just for her style collection",
    eyebrow: "TRENDING NOW",
    line: "JUST FOR HER",
    title: "STYLE",
    cta: "SHOP THE LOOK",
    link: "/categories",
    search: { category: "Women" },
  },
  {
    image: getImageSrc(heroMen),
    alt: "Fresh arrivals for men",
    eyebrow: "NEW ARRIVALS",
    line: "JUST FOR HIM",
    title: "FRESH",
    cta: "SHOP THE LOOK",
    link: "/categories",
    search: { category: "Men" },
  },
  {
    image: getImageSrc(heroJuniors),
    alt: "Playful styles for juniors",
    eyebrow: "KIDS FASHION",
    line: "JUST FOR JUNIORS",
    title: "PLAY",
    cta: "SHOP THE LOOK",
    link: "/categories",
    search: { category: "Boys" },
  },
];

const SLIDE_MS = 4500;

type HeroSlide = {
  image: string;
  alt: string;
  eyebrow: string;
  line: string;
  title: string;
  cta: string;
  href: string;
};

const fallbackSlides: HeroSlide[] = slides.map((s) => ({
  image: s.image,
  alt: s.alt,
  eyebrow: s.eyebrow,
  line: s.line,
  title: s.title,
  cta: s.cta,
  href: `${s.link}?category=${encodeURIComponent(s.search.category)}`,
}));

export function Hero() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const { data: banners } = useSiteBanners();

  const heroSlides: HeroSlide[] =
    banners && banners.length
      ? banners.map((b) => ({
          image: b.image_url,
          alt: b.title || "Faiza Zone promotional banner",
          eyebrow: b.subtitle || "",
          line: "",
          title: b.title || "",
          cta: b.button_text || "SHOP NOW",
          href: b.button_link || "/categories",
        }))
      : fallbackSlides;

  useEffect(() => {
    setIndex(0);
  }, [heroSlides.length]);

  const count = heroSlides.length;

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!playing || count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(id);
  }, [playing, count]);

  return (
    <section className="shop-container pt-4 sm:pt-6">
      <div className="group relative h-[180px] overflow-hidden rounded-2xl bg-secondary sm:h-[220px] md:h-[280px] lg:h-[340px] xl:h-[400px]">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {heroSlides.map((s, i) => (
            <div key={`${s.image}-${i}`} aria-hidden={i !== index} className="relative h-full w-full shrink-0">
              <img
                src={s.image}
                alt={s.alt}
                width={1600}
                height={704}
                loading={i === 0 ? "eager" : "lazy"}
                className={`h-full w-full object-cover ${i === index ? "hero-zoom" : ""}`}
              />
              {/* Centered text overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/20" />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center sm:px-10 md:px-16">
                {i === index ? (
                  <>
                    <p
                      className="hero-rise text-[8px] font-bold tracking-[0.2em] text-white/95 sm:text-xs"
                      style={{ animationDelay: "120ms" }}
                    >
                      {s.eyebrow}
                    </p>
                    <div
                      className="hero-rise my-1 h-px w-10 bg-white/70 sm:my-2 sm:w-20"
                      style={{ animationDelay: "200ms" }}
                    />
                    <p
                      className="hero-rise text-[9px] font-semibold tracking-[0.14em] text-white/95 sm:text-sm md:text-base"
                      style={{ animationDelay: "280ms" }}
                    >
                      {s.line}
                    </p>
                    <h2
                      className="hero-rise font-display text-3xl font-extrabold leading-[0.9] tracking-tight text-white sm:mt-1 sm:text-5xl md:text-6xl lg:text-7xl"
                      style={{ animationDelay: "360ms" }}
                    >
                      {s.title}
                    </h2>
                  </>
                ) : null}
              </div>

              {/* CTA above pagination */}
              {i === index ? (
                <a
                  href={s.href}
                  style={{ animationDelay: "480ms" }}
                  className="hero-rise absolute bottom-[3.25rem] left-1/2 z-10 inline-flex -translate-x-1/2 items-center rounded-full bg-white px-5 py-2 text-[11px] font-bold uppercase tracking-wide text-foreground shadow-md backdrop-blur transition hover:scale-105 hover:bg-white/95 sm:bottom-[4.25rem] sm:px-6 sm:py-3 sm:text-sm"
                >
                  {s.cta}
                </a>
              ) : null}
            </div>
          ))}
        </div>


        {/* Autoplay progress */}
        <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/25">
          <div
            key={`${index}-${playing}`}
            className="hero-progress-bar h-full w-full bg-white"
            style={{
              animationDuration: `${SLIDE_MS}ms`,
              animationPlayState: playing ? "running" : "paused",
            }}
          />
        </div>

        {/* Play / Pause */}
        <button
          type="button"
          aria-label={playing ? "Pause slideshow" : "Play slideshow"}
          onClick={() => setPlaying((p) => !p)}
          className="absolute right-2 bottom-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-foreground shadow transition hover:bg-white sm:right-5 sm:bottom-6 sm:h-10 sm:w-10"
        >
          {playing ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </button>


        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className="absolute top-1/2 left-4 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow transition hover:bg-white active:scale-95 sm:left-6 sm:h-12 sm:w-12"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(1)}
          className="absolute top-1/2 right-4 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow transition hover:bg-white active:scale-95 sm:right-6 sm:h-12 sm:w-12"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Pagination + dots */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/90 px-4 py-1.5 shadow-sm backdrop-blur sm:bottom-6 sm:gap-4 sm:px-5">
          <div className="flex gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold tabular-nums text-foreground">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="truncate text-lg font-bold sm:text-xl md:text-2xl">{title}</h2>
      {action ? (
        <button className="shrink-0 rounded-full bg-sale/10 px-3 py-1.5 text-xs font-semibold text-sale">
          {action}
        </button>
      ) : (
        <div className="flex shrink-0 gap-2">
          <button aria-label="Previous" className="grid h-9 w-9 place-items-center rounded-full border border-sale/30 text-sale">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button aria-label="Next" className="grid h-9 w-9 place-items-center rounded-full border border-sale/30 text-sale">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Categories() {
  return (
    <section className="shop-container py-8 sm:py-10">
      <SectionHeader title="Shop by Categories" />
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-8">
        {categories.map((c) => (
          <Link
            key={c.name}
            to="/categories"
            search={{ category: c.name }}
            className="overflow-hidden rounded-xl border border-border bg-card p-2 text-center transition-colors duration-200 hover:border-sale"
          >
            <img
              src={c.image}
              alt={c.name}
              loading="lazy"
              width={700}
              height={700}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <span className="mt-2 block truncate text-[11px] font-semibold text-brand-navy">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const promos = [
  {
    title: "Exclusive for Man",
    bg: "bg-brand-blush",
    image: getImageSrc(promoMen),
    alt: "Man wearing a warm winter coat and knit scarf",
    category: "Men",
  },
  {
    title: "Exclusive for Woman",
    bg: "bg-brand-sky",
    image: getImageSrc(promoWomen),
    alt: "Woman wearing a long winter coat and knit sweater",
    category: "Women",
  },
  {
    title: "Exclusive for Kids",
    bg: "bg-secondary",
    image: getImageSrc(promoKids),
    alt: "Two kids wearing winter puffer jackets and beanies",
    category: "Boys",
  },
];

type PromoItem = {
  key: string;
  title: string;
  bg: string;
  image: string;
  alt: string;
  href: string;
};

const tints = ["bg-brand-blush", "bg-brand-sky", "bg-secondary"];

const fallbackPromos: PromoItem[] = promos.map((p) => ({
  key: p.title,
  title: p.title,
  bg: p.bg,
  image: getImageSrc(p.image),
  alt: p.alt,
  href: `/categories?category=${encodeURIComponent(p.category)}`,
}));

export function PromoStrip() {
  const { data } = useSitePromotions();
  const small = (data ?? []).filter((p) => p.type === "small");

  const items: PromoItem[] = small.length
    ? small.map((p, i) => ({
        key: p.id,
        title: p.name,
        bg: tints[i % tints.length]!,
        image: p.image_url,
        alt: p.name,
        href: p.link || "/categories",
      }))
    : fallbackPromos;

  return (
    <section className="shop-container">
      {/* Mobile + tablet: swipeable slider */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <PromoCard key={p.key} promo={p} className="w-[78%] shrink-0 snap-start sm:w-[46%]" />
        ))}
      </div>
      {/* Desktop: 3 up grid */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-3">
        {items.map((p) => (
          <PromoCard key={p.key} promo={p} />
        ))}
      </div>
    </section>
  );
}

function PromoCard({ promo, className = "" }: { promo: PromoItem; className?: string }) {
  return (
    <a
      href={promo.href}
      className={`group relative flex items-center justify-between overflow-hidden rounded-xl ${promo.bg} p-4 transition-shadow hover:shadow-[0_2px_10px_rgb(0,0,0,0.08)] sm:p-5 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg italic text-sale">Winter</p>
        <h3 className="mt-1 truncate text-sm font-bold sm:text-base">{promo.title}</h3>
        <p className="text-xs text-muted-foreground">2022-23</p>
        <p className="mt-2 text-[11px] text-muted-foreground">Available in store &amp; online</p>
      </div>
      <img
        src={promo.image}
        alt={promo.alt}
        loading="lazy"
        width={800}
        height={800}
        className="h-24 w-24 shrink-0 rounded-lg object-cover object-top transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28"
      />
    </a>
  );
}


export function WinterBanner() {
  const { data } = useSitePromotions();
  const big = (data ?? []).find((p) => p.type === "big");

  if (big) {
    return (
      <section className="shop-container py-8 sm:py-10">
        <a href={big.link || "/categories"} className="block overflow-hidden rounded-xl">
          <img
            src={big.image_url}
            alt={big.name}
            loading="lazy"
            className="h-40 w-full object-cover sm:h-56 md:h-64"
          />
        </a>
      </section>
    );
  }

  return (
    <section className="shop-container py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={getImageSrc(winterImg)}
          alt="Winter collection featuring warm coats and layered knitwear"
          loading="lazy"
          width={1600}
          height={560}
          className="h-40 w-full object-cover object-left sm:h-56 md:h-64"
        />
        <div className="absolute inset-y-0 right-0 flex w-1/2 flex-col justify-center pr-4 text-right sm:pr-8">
          <p className="font-display text-lg italic text-sale sm:text-2xl">Winter</p>
          <h2 className="text-xl font-extrabold text-brand-navy sm:text-3xl md:text-4xl">Collection</h2>
          <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
            Insulated layers, heavy knits and weather-ready outerwear.
          </p>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Headphones, title: "Professional Service", text: "Efficient customer support from passionate team" },
  { icon: ShieldCheck, title: "Secure Payment", text: "Different secure payment methods" },
  { icon: Truck, title: "Fast Delivery", text: "Fast and convenient door to door delivery" },
  { icon: BadgeCheck, title: "Quality & Savings", text: "Comprehensive quality control and affordable prices" },
];

export function Features() {
  return (
    <section className="shop-container grid gap-5 border-t border-border py-8 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((f) => (
        <div key={f.title} className="flex min-w-0 gap-3">
          <f.icon className="h-5 w-5 shrink-0 text-sale" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

const footerCols = [
  {
    title: "Support",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Track Order", to: "/track-order" },
      { label: "Return Policy", to: "/return-policy" },
      { label: "Size Guide", to: "/size-guide" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Shop All", to: "/categories", search: { category: undefined } },
      { label: "My Account", to: "/account" },
      { label: "Wishlist", to: "/wishlist" },
    ],
  },
];

const quickLinksMobile = [
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Affiliate Program", to: "#" },
  { label: "Sitemap", to: "#" },
  { label: "Refund & Return", to: "/return-policy" },
  { label: "Privacy Policy", to: "#" },
  { label: "Terms & Conditions", to: "#" },
];

const categoryLinks = [
  { label: "Men", search: { category: "Men" } },
  { label: "Women", search: { category: "Women" } },
  { label: "Juniors", search: { category: "Boys" } },
  { label: "T-Shirts", search: { category: "T-Shirts" } },
  { label: "Pants", search: { category: "Pants" } },
  { label: "Bags", search: { category: "Bags" } },
];

const paymentBadges = [
  { label: "Visa", bg: "bg-[oklch(0.35_0.08_260)]", text: "text-white" },
  { label: "Mastercard", bg: "bg-[oklch(0.25_0.06_30)]", text: "text-white" },
  { label: "Amex", bg: "bg-[oklch(0.55_0.12_240)]", text: "text-white" },
  { label: "bKash", bg: "bg-[oklch(0.55_0.18_145)]", text: "text-white" },
  { label: "Nagad", bg: "bg-[oklch(0.55_0.2_25)]", text: "text-white" },
];

function FooterAccordion({
  title,
  children,
  open,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold"
      >
        {title}
        {open ? <Minus className="h-4 w-4 text-muted-foreground" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="pb-4 pt-0.5">{children}</div>}
    </div>
  );
}

export function Footer() {
  const footerMarkets = useActiveCountries();
  const [openQuick, setOpenQuick] = useState(true);
  const [openCat, setOpenCat] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <>
      <footer className="bg-secondary/40 pb-6 pt-6 lg:bg-brand-navy lg:text-background lg:pb-0 lg:pt-10">
        {/* Mobile / tablet card footer */}
        <div className="shop-container lg:hidden">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_6px_oklch(0.21_0.03_264/0.06)] sm:p-5">
            <FooterAccordion title="Quick Links" open={openQuick} onToggle={() => setOpenQuick((v) => !v)}>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                {quickLinksMobile.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterAccordion>

            <FooterAccordion title="Categories" open={openCat} onToggle={() => setOpenCat((v) => !v)}>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-muted-foreground">
                {categoryLinks.map((c) => (
                  <li key={c.label}>
                    <Link to="/categories" search={c.search} className="hover:text-foreground">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterAccordion>

            <div className="mt-5 border-t border-border pt-5 text-center">
              <p className="text-sm font-semibold">Simplify Your gifting experience with our app.</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <a
                  href="#"
                  aria-label="Get it on Google Play"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-3 text-[10px] font-semibold text-background"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M3.609 1.814 13.792 12 3.61 22.186c-.175-.097-.29-.283-.29-.497V2.31c0-.213.115-.4.29-.496zm10.654 11.186L6.96 22.99l9.18-5.303 1.123-1.94-2.999-1.733.001-.001-.001-.001 2.999-1.733-1.123-1.94-9.18-5.303 7.303 9.98zm3.97-2.858-3.011 1.741 3.011 1.741 1.123-1.94-1.123-1.942zM5.709 1.31l7.303 9.98-7.303 9.98V1.31z" />
                  </svg>
                  GET IT ON Google Play
                </a>
                <a
                  href="#"
                  aria-label="Download on the App Store"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-3 text-[10px] font-semibold text-background"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Download on the App Store
                </a>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5 text-center">
              <p className="text-sm font-semibold">Subscribe &amp; Get 10% Off</p>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEmail("");
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-sale"
                />
                <button
                  type="submit"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-foreground text-background"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {paymentBadges.map((b) => (
              <span
                key={b.label}
                className={`inline-flex h-7 items-center rounded px-2 text-[10px] font-bold tracking-tight ${b.bg} ${b.text}`}
              >
                {b.label}
              </span>
            ))}
          </div>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Faiza Zone. All rights reserved.
          </p>
        </div>

        {/* Desktop footer */}
        <div className="shop-container hidden lg:grid lg:grid-cols-4 lg:gap-8">
          <div>
            <p className="font-display text-xl font-extrabold">
              <span className="text-sale">Faiza</span> Zone
            </p>
            <p className="mt-3 max-w-xs text-xs text-background/70">
              Everyday essentials and seasonal fashion, delivered across Bangladesh, USA and UK.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              {footerMarkets.map((m) => (
                <Link
                  key={m.code}
                  to="/$market"
                  params={{ market: m.code }}
                  className="rounded-full bg-background/10 px-3 py-1 hover:bg-background/20"
                >
                  {m.code.toUpperCase()} · {m.symbol}
                </Link>
              ))}
            </div>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2 text-xs text-background/70">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link {...(l as unknown as { to: string })} className="hover:text-background">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2 text-xs text-background/70">
              <li>House 12, Road 5, Dhanmondi, Dhaka</li>
              <li>support@faizazone.com</li>
              <li>+880 1700-000000</li>
            </ul>
          </div>
        </div>
        <div className="hidden border-t border-background/10 py-4 text-center text-[11px] text-background/60 lg:block">
          © {new Date().getFullYear()} Faiza Zone. All rights reserved.
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/8801700000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-4 bottom-20 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 lg:bottom-6"
      >
        <Phone className="h-6 w-6" fill="currentColor" />
      </a>
    </>
  );
}