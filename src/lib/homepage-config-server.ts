import { supabase } from "@/integrations/supabase/client";

export type CategoryItemConfig = {
  id: string;
  name: string;
  image?: string;
  is_active: boolean;
};

export type PromoAdItem = {
  id: string;
  title: string;
  tag?: string;
  badge?: string;
  description?: string;
  image: string;
  link: string;
  bg_color: string;
  is_active: boolean;
};

export type PromoBannerItem = {
  id: string;
  image: string;
  tag: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  align: "right" | "left" | "center";
  is_active: boolean;
};

export type ProductSectionLayout =
  | "grid_4"
  | "grid_3"
  | "carousel"
  | "featured"
  | "two_column";

export type ProductSectionConfig = {
  id: string;
  key: string;
  name: string;
  action_label?: string;
  action_link?: string;
  is_active: boolean;
  layout: ProductSectionLayout;
  source: "auto" | "selected" | "category";
  category_filter?: string;
  selected_product_ids?: string[];
  max_items?: number;
};

export type CategoriesSectionConfig = {
  enabled: boolean;
  title: string;
  mode: "all" | "selected";
  layout: "grid_8" | "grid_4" | "carousel" | "rounded";
  items: CategoryItemConfig[];
};

export type PromoStripSectionConfig = {
  enabled: boolean;
  title?: string;
  items: PromoAdItem[];
};

export type MidBannerSectionConfig = {
  enabled: boolean;
  banners: PromoBannerItem[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
};

export type FaqSectionConfig = {
  enabled: boolean;
  title: string;
  subtitle?: string;
  items: FaqItem[];
};

export type SeoArticleSectionConfig = {
  enabled: boolean;
  badge_label?: string;
  badge_trust?: string;
  title: string;
  preview_text: string;
  section_1_title?: string;
  section_1_body?: string;
  section_2_title?: string;
  section_2_body?: string;
  section_3_title?: string;
  section_3_body?: string;
  custom_content?: string;
  read_more_label?: string;
  show_less_label?: string;
};

export type HomepageConfig = {
  hero_enabled: boolean;
  categories: CategoriesSectionConfig;
  promo_strip: PromoStripSectionConfig;
  trending: ProductSectionConfig;
  mid_banner: MidBannerSectionConfig;
  ethnic: ProductSectionConfig;
  flash_sale: ProductSectionConfig;
  popular: ProductSectionConfig;
  extra_sections: ProductSectionConfig[];
  features_enabled: boolean;
  faq?: FaqSectionConfig;
  seo_article?: SeoArticleSectionConfig;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  hero_enabled: true,
  categories: {
    enabled: true,
    title: "Shop by Categories",
    mode: "all",
    layout: "grid_8",
    items: [
      { id: "cat-1", name: "Men", is_active: true },
      { id: "cat-2", name: "Women", is_active: true },
      { id: "cat-3", name: "Kurti", is_active: true },
      { id: "cat-4", name: "Panjabi", is_active: true },
      { id: "cat-5", name: "Boys", is_active: true },
      { id: "cat-6", name: "T-shirt", is_active: true },
      { id: "cat-7", name: "Pants", is_active: true },
      { id: "cat-8", name: "Bags", is_active: true },
    ],
  },
  promo_strip: {
    enabled: true,
    title: "",
    items: [
      {
        id: "promo-1",
        title: "Exclusive for Man",
        tag: "Winter",
        badge: "2026-27",
        description: "Available in store & online",
        image: "",
        link: "/categories?category=Men",
        bg_color: "bg-brand-blush",
        is_active: true,
      },
      {
        id: "promo-2",
        title: "Exclusive for Woman",
        tag: "Winter",
        badge: "2026-27",
        description: "Available in store & online",
        image: "",
        link: "/categories?category=Women",
        bg_color: "bg-brand-sky",
        is_active: true,
      },
      {
        id: "promo-3",
        title: "Exclusive for Kids",
        tag: "Winter",
        badge: "2026-27",
        description: "Available in store & online",
        image: "",
        link: "/categories?category=Boys",
        bg_color: "bg-secondary",
        is_active: true,
      },
    ],
  },
  trending: {
    id: "sec-trending",
    key: "trending",
    name: "Trendy Now",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "selected",
    selected_product_ids: ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"],
    max_items: 8,
  },
  mid_banner: {
    enabled: true,
    banners: [
      {
        id: "banner-1",
        image: "",
        tag: "Winter",
        title: "Collection",
        description: "Insulated layers, heavy knits and weather-ready outerwear.",
        button_text: "SHOP NOW",
        button_link: "/categories",
        align: "right",
        is_active: true,
      },
    ],
  },
  ethnic: {
    id: "sec-ethnic",
    key: "ethnic",
    name: "Ethnic Collection",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "auto",
    category_filter: "Kurti",
    selected_product_ids: ["e1", "e2", "e3", "e4"],
    max_items: 8,
  },
  flash_sale: {
    id: "sec-flash",
    key: "flash_sale",
    name: "Flash Sale",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "auto",
    selected_product_ids: ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"],
    max_items: 8,
  },
  popular: {
    id: "sec-popular",
    key: "popular",
    name: "Most Popular",
    action_label: "View all",
    action_link: "/categories",
    is_active: true,
    layout: "grid_4",
    source: "selected",
    selected_product_ids: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
    max_items: 8,
  },
  extra_sections: [],
  features_enabled: true,
  faq: {
    enabled: true,
    title: "Frequently Asked Questions (FAQ)",
    subtitle: "Everything you need to know about shopping, delivery, payments & quality at Faiza Zone",
    items: [
      {
        id: "faq-1",
        question: "How long does delivery take for domestic and international orders?",
        answer: "Inside Dhaka, standard delivery takes 24–48 hours (express same-day available). Nationwide delivery across Bangladesh takes 2–3 business days. For international orders (USA, UK, Canada, Australia), DHL/FedEx express delivery takes 5–8 business days with real-time end-to-end tracking.",
        is_active: true,
      },
      {
        id: "faq-2",
        question: "Are all products at Faiza Zone authentic and quality checked?",
        answer: "Yes, 100% authentic. Every garment, accessory, and footwear item undergoes strict 3-tier quality inspection before dispatch. Our fabrics are sourced directly from certified textile mills and comply with international colorfastness and shrinkage standards.",
        is_active: true,
      },
      {
        id: "faq-3",
        question: "What payment methods are supported?",
        answer: "We support Cash on Delivery (COD) inside Bangladesh, bKash, Nagad, Rocket, Upay, Visa, MasterCard, and American Express. For international shoppers, we accept global credit/debit cards via secure 256-bit encrypted checkout.",
        is_active: true,
      },
      {
        id: "faq-4",
        question: "Can I exchange or return an item if the size does not fit?",
        answer: "Absolutely. We offer a hassle-free 7-day return and exchange policy. Simply initiate a return request from your account or contact our customer support via WhatsApp or email with your order ID.",
        is_active: true,
      },
      {
        id: "faq-5",
        question: "How do I choose the right size for Kurtis, Panjabis, or Shoes?",
        answer: "Each product page contains a detailed Size Chart with chest, length, shoulder, and sleeve measurements in inches and centimeters. If you are between sizes, we recommend sizing up for regular fit or checking our interactive Size Guide.",
        is_active: true,
      },
    ],
  },
  seo_article: {
    enabled: true,
    badge_label: "Online Fashion Guide",
    badge_trust: "Trusted by Shopping Warehouses",
    title: "Faiza Zone — The Premier Online Fashion & Lifestyle Shopping Destination in Bangladesh",
    preview_text: "Looking for authentic, trendsetting clothing with guaranteed fabric quality and affordable pricing? Faiza Zone is Bangladesh's leading e-commerce platform offering an exquisite fusion of traditional South Asian ethnic fashion and contemporary global streetwear.",
    section_1_title: "Curated Ethnic Wear: Elegant Kurtis, Panjabis & Festive Attire",
    section_1_body: "Whether dressing up for festive celebrations, weddings, or everyday corporate elegance, our handcrafted designer kurti collection features breathable cotton, georgette, and intricate embroidery. For gentlemen, explore our signature mens panjabi range, tailor-fitted from premium jacquard, linen, and pure combed cotton to deliver unmatched comfort and royal poise.",
    section_2_title: "Modern Everyday Styles: Hoodies, Tees, Denim & Footwear",
    section_2_body: "From cozy fleece-lined winter hoodies and athletic joggers to heavyweight mens streetwear and chic womens western apparel, each garment complies with internationally recognized textile quality and skin-friendly standards. Match your outfit with durable gabardine trousers and versatile backpacks designed for active urban living.",
    section_3_title: "Transparent Shopping, Express Nationwide Delivery & Global Dispatch",
    section_3_body: "Enjoy seamless shopping with door-to-door Cash on Delivery (COD) across Dhaka, Chattogram, Sylhet, and every district in Bangladesh, alongside fast DHL/FedEx worldwide delivery to the USA, UK, Canada, and Australia. Every transaction is guarded with bank-grade encryption certified under PCI-DSS security benchmarks.",
    read_more_label: "Read More",
    show_less_label: "Show Less",
  },
};

export async function fetchServerHomepageConfig(): Promise<HomepageConfig> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_config")
      .maybeSingle();

    if (!error && data?.value && typeof data.value === "object" && Object.keys(data.value).length > 0) {
      const val = data.value as Partial<HomepageConfig>;
      return {
        ...DEFAULT_HOMEPAGE_CONFIG,
        ...val,
        categories: { ...DEFAULT_HOMEPAGE_CONFIG.categories, ...(val.categories || {}) },
        promo_strip: { ...DEFAULT_HOMEPAGE_CONFIG.promo_strip, ...(val.promo_strip || {}) },
        trending: { ...DEFAULT_HOMEPAGE_CONFIG.trending, ...(val.trending || {}) },
        mid_banner: { ...DEFAULT_HOMEPAGE_CONFIG.mid_banner, ...(val.mid_banner || {}) },
        ethnic: { ...DEFAULT_HOMEPAGE_CONFIG.ethnic, ...(val.ethnic || {}) },
        flash_sale: { ...DEFAULT_HOMEPAGE_CONFIG.flash_sale, ...(val.flash_sale || {}) },
        popular: { ...DEFAULT_HOMEPAGE_CONFIG.popular, ...(val.popular || {}) },
        faq: {
          ...DEFAULT_HOMEPAGE_CONFIG.faq!,
          ...(val.faq || {}),
          items: Array.isArray(val.faq?.items) && val.faq.items.length > 0
            ? val.faq.items
            : DEFAULT_HOMEPAGE_CONFIG.faq!.items,
        },
        seo_article: {
          ...DEFAULT_HOMEPAGE_CONFIG.seo_article!,
          ...(val.seo_article || {}),
          // Ensure no hardcoded number like "120,000+" or "2000+" remains in badge_trust
          badge_trust:
            val.seo_article?.badge_trust &&
            !val.seo_article.badge_trust.includes("120,000") &&
            !val.seo_article.badge_trust.includes("2000+")
              ? val.seo_article.badge_trust
              : "Trusted by Shopping Warehouses",
        },
      };
    }
  } catch (err) {
    console.warn("Direct Supabase fetch error:", err);
  }

  return DEFAULT_HOMEPAGE_CONFIG;
}
