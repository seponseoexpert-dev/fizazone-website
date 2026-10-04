"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/components/ui/link";
import {
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Globe,
  Grid,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  fetchHomepageConfig,
  saveHomepageConfig,
  type HomepageConfig,
  type CategoryItemConfig,
  type PromoAdItem,
  type PromoBannerItem,
  type ProductSectionConfig,
  type ProductSectionLayout,
} from "@/lib/homepage-config";
import { allProducts, categories as defaultCategories, type Product } from "@/components/shop/data";

type Lang = "en" | "bn";

const DICT = {
  en: {
    pageTitle: "Homepage Customizer & Sections",
    pageDesc: "Configure homepage sections, categories, advertisements, trending layouts, and featured products.",
    resetBtn: "Reset",
    previewBtn: "Preview Store",
    saveBtn: "Save All Changes",
    savingBtn: "Saving...",
    tabs: {
      categories: "Shop by Categories",
      promo_strip: "Advertisements",
      trending: "Trending Now",
      mid_banner: "Promo Banner",
      popular: "Most Popular Products",
      extra_sections: "More Sections",
    },
    status: {
      active: "Active",
      off: "Off",
      enabled: "Section Enabled",
      disabled: "Section Disabled",
      itemsEnabled: "of items enabled",
      selectedCount: "products selected",
    },
    categories: {
      title: "Category by Shop Management",
      desc: "Enable/disable category section, choose display style, select all or handpick categories.",
      headingLabel: "Section Heading",
      modeLabel: "Category Display Mode",
      modeAll: "All Categories",
      modeSelected: "Selected Categories Only",
      layoutLabel: "Layout Style",
      listLabel: "Categories ON/OFF & Selection",
    },
    promo: {
      title: "Advertisements Strip Management",
      desc: "Control promotional ad cards with custom text, images, badges, links, and multiple advertisements.",
      addBtn: "Add Advertisement",
      noAds: "No advertisements added yet. Click 'Add Advertisement' to create one.",
      mainTitle: "Main Title",
      tagText: "Eyebrow Tag",
      badgeText: "Badge Text",
      linkText: "Target Link",
      bgText: "Theme Color",
      descText: "Description Note",
      imageLabel: "Ad Image (Upload or URL)",
      uploadBtn: "Upload Promo Image",
    },
    midBanner: {
      title: "Mid-Page Promo Banner",
      desc: "Change or add mid-page callout banner with image, headline, button, and text alignments.",
      tagLabel: "Eyebrow Tag (e.g. Winter)",
      headlineLabel: "Headline Title (e.g. Collection)",
      buttonLabel: "Button Text",
      linkLabel: "Button Link",
      alignLabel: "Text Alignment",
      alignRight: "Right Aligned",
      alignLeft: "Left Aligned",
      alignCenter: "Centered",
      descLabel: "Description",
      imageLabel: "Banner Image (Upload or URL)",
      uploadBtn: "Upload Banner Image",
    },
    sections: {
      headingLabel: "Section Heading",
      actionLabel: "Action Button Text",
      maxLabel: "Max Products to Show",
      layoutLabel: "Display Style & Layout",
      activeStyle: "ACTIVE STYLE",
      sourceLabel: "Product Source",
      sourceAuto: "Auto / All",
      sourceHandpick: "Handpick Products",
      selectedLabel: "Selected Products",
      searchPlaceholder: "Search products to select by name or category...",
      noSelected: "No products handpicked yet. Click on any product below to select it.",
      availableTitle: "Store Products Catalog (Click to select/unselect)",
    },
    layouts: {
      carousel: {
        label: "Horizontal Scroll (Carousel)",
        desc: "Swipeable slider with left/right arrows for touch and mobile friendliness",
      },
      grid_3: {
        label: "3 Products Per Line (3 Columns)",
        desc: "Spacious 3-column grid highlighting product details",
      },
      grid_4: {
        label: "4 Products Per Line (4 Columns)",
        desc: "Standard modern e-commerce 4-column product grid",
      },
      featured: {
        label: "Featured Hero + Side Grid",
        desc: "1 large highlight card on the left + 4 products on the right",
      },
      two_column: {
        label: "2-Column Showcase",
        desc: "Prominent wide cards with details and quick action buttons",
      },
    },
    toasts: {
      saveSuccess: "Homepage configuration saved successfully!",
      saveError: "Failed to save configuration",
      resetConfirm: "Are you sure you want to reset all homepage settings to defaults?",
      resetDone: "Settings reset to defaults. Click 'Save All Changes' to apply.",
      deleteConfirm: "Delete this item?",
    },
  },
  bn: {
    pageTitle: "হোমপেজ কাস্টমাইজার ও সেকশন নিয়ন্ত্রণ",
    pageDesc: "হোমপেজের প্রতিটি সেকশন, ক্যাটাগরি, বিজ্ঞাপন, ট্রেন্ডিং প্রোডাক্ট লেআউট এবং ফিচার্ড প্রোডাক্ট নিয়ন্ত্রণ করুন।",
    resetBtn: "রিসেট",
    previewBtn: "প্রিভিউ স্টোর",
    saveBtn: "সব পরিবর্তন সেভ করুন",
    savingBtn: "সেভ হচ্ছে...",
    tabs: {
      categories: "ক্যাটাগরি সমূহ",
      promo_strip: "বিজ্ঞাপন সমূহ",
      trending: "ট্রেন্ডিং প্রোডাক্ট",
      mid_banner: "প্রমোশনাল ব্যানার",
      popular: "জনপ্রিয় প্রোডাক্ট",
      extra_sections: "অতিরিক্ত সেকশন",
    },
    status: {
      active: "চালু",
      off: "বন্ধ",
      enabled: "সেকশন চালু আছে",
      disabled: "সেকশন বন্ধ আছে",
      itemsEnabled: "টি আইটেম চালু আছে",
      selectedCount: "টি প্রোডাক্ট নির্বাচিত",
    },
    categories: {
      title: "ক্যাটাগরি সেকশন ব্যবস্থাপনা",
      desc: "ক্যাটাগরি সেকশন চালু/বন্ধ করুন, স্টাইল পরিবর্তন করুন এবং নির্দিষ্ট ক্যাটাগরি নির্বাচন করুন।",
      headingLabel: "সেকশন শিরোনাম",
      modeLabel: "ক্যাটাগরি প্রদর্শন মোড",
      modeAll: "সকল ক্যাটাগরি",
      modeSelected: "শুধু নির্বাচিত ক্যাটাগরি",
      layoutLabel: "প্রদর্শনের স্টাইল",
      listLabel: "ক্যাটাগরি অন/অফ ও নির্বাচন",
    },
    promo: {
      title: "বিজ্ঞাপন স্ট্রিপ ব্যবস্থাপনা",
      desc: "কাস্টম টেক্সট, ছবি, ব্যাজ, লিংক ও থিম কালার সহ একাধিক বিজ্ঞাপন নিয়ন্ত্রণ করুন।",
      addBtn: "নতুন বিজ্ঞাপন যোগ করুন",
      noAds: "কোনো বিজ্ঞাপন তৈরি করা হয়নি। 'নতুন বিজ্ঞাপন যোগ করুন' বাটনে ক্লিক করুন।",
      mainTitle: "বিজ্ঞাপনের মূল শিরোনাম",
      tagText: "ট্যাগ টেক্সট",
      badgeText: "ব্যাজ টেক্সট",
      linkText: "টার্গেট লিংক",
      bgText: "থিম কালার",
      descText: "বিবরণী নোট",
      imageLabel: "বিজ্ঞাপনের ছবি (আপলোড বা URL)",
      uploadBtn: "বিজ্ঞাপনের ছবি আপলোড",
    },
    midBanner: {
      title: "বিজ্ঞাপন ব্যানার (মাঝখানের ব্যানার)",
      desc: "হোমপেজের মাঝখানের ব্যানার পরিবর্তন করুন, ছবি আপলোড করুন ও টেক্সট সাজান।",
      tagLabel: "ট্যাগ টেক্সট (যেমন: Winter)",
      headlineLabel: "মূল শিরোনাম (যেমন: Collection)",
      buttonLabel: "বাটন টেক্সট",
      linkLabel: "বাটন লিংক",
      alignLabel: "টেক্সট অ্যালাইনমেন্ট",
      alignRight: "ডান পাশে",
      alignLeft: "বাম পাশে",
      alignCenter: "মাঝখানে",
      descLabel: "বর্ণনা",
      imageLabel: "ব্যানারের ছবি (আপলোড বা URL)",
      uploadBtn: "ব্যানার ছবি আপলোড",
    },
    sections: {
      headingLabel: "সেকশন শিরোনাম",
      actionLabel: "বাটন টেক্সট",
      maxLabel: "সর্বোচ্চ প্রোডাক্ট সংখ্যা",
      layoutLabel: "প্রদর্শনের স্টাইল ও লেআউট",
      activeStyle: "নির্বাচিত স্টাইল",
      sourceLabel: "প্রোডাক্ট সোর্স",
      sourceAuto: "স্বয়ংক্রিয় / সকল",
      sourceHandpick: "নির্দিষ্ট প্রোডাক্ট নির্বাচন",
      selectedLabel: "নির্বাচিত প্রোডাক্ট সমূহ",
      searchPlaceholder: "প্রোডাক্টের নাম বা ক্যাটাগরি লিখে খুঁজুন...",
      noSelected: "এখনও কোনো প্রোডাক্ট নির্বাচন করা হয়নি। নিচের তালিকা থেকে প্রোডাক্ট সিলেক্ট করুন।",
      availableTitle: "স্টোরের সকল প্রোডাক্ট (সিলেক্ট করতে ক্লিক করুন)",
    },
    layouts: {
      carousel: {
        label: "হরাইজন্টাল স্ক্রোল (ক্যারোসেল)",
        desc: "মোবাইল ও ডেক্সটপে ডানে-বামে অ্যারো দিয়ে সোয়াইপযোগ্য স্লাইডার",
      },
      grid_3: {
        label: "এক লাইনে ৩টি প্রোডাক্ট (৩ কলাম)",
        desc: "প্রশস্ত ৩-কলাম বিশিষ্ট আকর্ষণীয় গ্রিড লেআউট",
      },
      grid_4: {
        label: "এক লাইনে ৪টি প্রোডাক্ট (৪ কলাম)",
        desc: "আধুনিক ই-কমার্স স্ট্যান্ডার্ড ৪-কলাম বিশিষ্ট গ্রিড",
      },
      featured: {
        label: "ফিচার্ড হিরো কার্ড + সাইড গ্রিড",
        desc: "বামে ১টি বড় হাইলাইট কার্ড এবং ডানে ৪টি ছোট কার্ড",
      },
      two_column: {
        label: "২-কলাম বিশিষ্ট বড় কার্ড শোকেস",
        desc: "বিস্তারিত তথ্য ও বাটন সহ প্রশস্ত ২-কলাম কার্ড শোকেস",
      },
    },
    toasts: {
      saveSuccess: "হোমপেজ সেটিংস সফলভাবে সেভ করা হয়েছে!",
      saveError: "সেটিংস সেভ করতে ব্যর্থ হয়েছে",
      resetConfirm: "আপনি কি সব সেটিংস ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?",
      resetDone: "সেটিংস ডিফল্ট করা হয়েছে। পরিবর্তন নিশ্চিত করতে 'সব পরিবর্তন সেভ করুন' বাটনে চাপুন।",
      deleteConfirm: "আপনি কি এটি ডিলিট করতে চান?",
    },
  },
};

const TINTS = [
  { label: "Blush Pink", value: "bg-brand-blush", preview: "#fde8e8" },
  { label: "Sky Blue", value: "bg-brand-sky", preview: "#e0f2fe" },
  { label: "Cool Slate", value: "bg-secondary", preview: "#f1f5f9" },
  { label: "Warm Amber", value: "bg-amber-500/10", preview: "#fef3c7" },
  { label: "Emerald Mint", value: "bg-emerald-500/10", preview: "#d1fae5" },
  { label: "Rose Coral", value: "bg-rose-500/10", preview: "#ffe4e6" },
  { label: "Indigo Violet", value: "bg-indigo-500/10", preview: "#e0e7ff" },
];

type ActiveTab =
  | "categories"
  | "promo_strip"
  | "trending"
  | "mid_banner"
  | "popular"
  | "extra_sections";

export default function AdminHomepageStudioPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [activeTab, setActiveTab] = useState<ActiveTab>("categories");
  const [lang, setLang] = useState<Lang>("bn"); // default to Bengali, switchable to English
  const [availableProducts, setAvailableProducts] = useState<Product[]>(allProducts);

  const t = DICT[lang];
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Tab scroll navigation
  const scrollTabs = (dir: "left" | "right") => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({
        left: dir === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await fetchHomepageConfig();
      setConfig(cfg);

      // Load products from DB
      try {
        const { data: dbProducts } = await supabase
          .from("products")
          .select("id, name, slug, price, sale_price, images, category")
          .limit(100);

        if (dbProducts && dbProducts.length > 0) {
          const mapped: Product[] = dbProducts.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: p.images?.[0] || allProducts[0]?.image || "",
            price: p.sale_price ?? p.price,
            oldPrice: p.sale_price ? p.price : undefined,
            rating: 5,
            category: p.category,
            flash: Boolean(p.sale_price),
          }));

          const seen = new Set<string>();
          const merged = [...mapped, ...allProducts].filter((p) =>
            seen.has(p.id) ? false : seen.add(p.id),
          );
          setAvailableProducts(merged);
        }
      } catch (e) {
        console.warn("DB product fetch fallback:", e);
      }
    } catch (err) {
      toast.error(lang === "bn" ? "হোমপেজ ডাটা লোড করা যায়নি" : "Could not load homepage data");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setAllowed(true);
        void loadData();
        return;
      }
      const ok = await isAdmin(data.user.id);
      setAllowed(ok !== false);
      void loadData();
    })();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveHomepageConfig(config);
      toast.success(t.toasts.saveSuccess);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.toasts.saveError;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(t.toasts.resetConfirm)) {
      setConfig(DEFAULT_HOMEPAGE_CONFIG);
      toast.info(t.toasts.resetDone);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sale" />
          <p className="text-sm font-medium text-muted-foreground">
            {lang === "bn" ? "হোমপেজ সেটিংস লোড হচ্ছে..." : "Loading Homepage Customizer..."}
          </p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6 pb-20">
        {/* Top Header & Action Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sale/10 p-1.5 text-sale">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t.pageTitle}
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t.pageDesc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Language Switcher Button (Strict single language) */}
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  lang === "en" ? "bg-sale text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                  lang === "bn" ? "bg-sale text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                বাংলা
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.resetBtn}
            </button>

            <Link
              to="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-sale"
            >
              <Eye className="h-3.5 w-3.5" />
              {t.previewBtn}
            </Link>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-sale px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-sale/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? t.savingBtn : t.saveBtn}
            </button>
          </div>
        </div>

        {/* Scrollable Tabs Container with Left & Right Nav Buttons */}
        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="Scroll tabs left"
            onClick={() => scrollTabs("left")}
            className="absolute left-0 z-10 grid h-8 w-8 -translate-x-2 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-sm transition hover:bg-sale hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={tabsScrollRef}
            className="flex gap-2 overflow-x-auto px-6 py-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full"
          >
            <TabButton
              active={activeTab === "categories"}
              onClick={() => setActiveTab("categories")}
              icon={<Layers className="h-4 w-4" />}
              label={t.tabs.categories}
              badge={config.categories.enabled ? t.status.active : t.status.off}
              badgeTone={config.categories.enabled ? "green" : "gray"}
            />
            <TabButton
              active={activeTab === "promo_strip"}
              onClick={() => setActiveTab("promo_strip")}
              icon={<Megaphone className="h-4 w-4" />}
              label={t.tabs.promo_strip}
              badge={`${config.promo_strip.items.filter((i) => i.is_active).length}`}
              badgeTone={config.promo_strip.enabled ? "blue" : "gray"}
            />
            <TabButton
              active={activeTab === "trending"}
              onClick={() => setActiveTab("trending")}
              icon={<Flame className="h-4 w-4" />}
              label={t.tabs.trending}
              badge={config.trending.is_active ? t.status.active : t.status.off}
              badgeTone={config.trending.is_active ? "amber" : "gray"}
            />
            <TabButton
              active={activeTab === "mid_banner"}
              onClick={() => setActiveTab("mid_banner")}
              icon={<ImageIcon className="h-4 w-4" />}
              label={t.tabs.mid_banner}
              badge={config.mid_banner.enabled ? t.status.active : t.status.off}
              badgeTone={config.mid_banner.enabled ? "green" : "gray"}
            />
            <TabButton
              active={activeTab === "popular"}
              onClick={() => setActiveTab("popular")}
              icon={<Star className="h-4 w-4" />}
              label={t.tabs.popular}
              badge={config.popular.is_active ? t.status.active : t.status.off}
              badgeTone={config.popular.is_active ? "green" : "gray"}
            />
            <TabButton
              active={activeTab === "extra_sections"}
              onClick={() => setActiveTab("extra_sections")}
              icon={<Boxes className="h-4 w-4" />}
              label={t.tabs.extra_sections}
            />
          </div>

          <button
            type="button"
            aria-label="Scroll tabs right"
            onClick={() => scrollTabs("right")}
            className="absolute right-0 z-10 grid h-8 w-8 translate-x-2 place-items-center rounded-full border border-border bg-background/95 text-foreground shadow-sm transition hover:bg-sale hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SHOP BY CATEGORIES                                                  */}
        {/* ========================================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.categories.title}</h2>
                <p className="text-xs text-muted-foreground">{t.categories.desc}</p>
              </div>

              {/* Section Enable Toggle */}
              <label className="relative inline-flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.categories.enabled}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      categories: { ...prev.categories, enabled: e.target.checked },
                    }))
                  }
                  className="peer sr-only"
                />
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {config.categories.enabled ? t.status.enabled : t.status.disabled}
                </span>
                <div className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-sale peer-focus:outline-none after:absolute after:right-[23px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {config.categories.enabled && (
              <div className="space-y-6 pt-2">
                {/* Title & Mode */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t.categories.headingLabel}
                    </label>
                    <input
                      type="text"
                      value={config.categories.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          categories: { ...prev.categories, title: e.target.value },
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
                      placeholder="Shop by Categories"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      {t.categories.modeLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            categories: { ...prev.categories, mode: "all" },
                          }))
                        }
                        className={`h-10 rounded-lg border text-xs font-semibold transition ${
                          config.categories.mode === "all"
                            ? "border-sale bg-sale/10 text-sale"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {t.categories.modeAll}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            categories: { ...prev.categories, mode: "selected" },
                          }))
                        }
                        className={`h-10 rounded-lg border text-xs font-semibold transition ${
                          config.categories.mode === "selected"
                            ? "border-sale bg-sale/10 text-sale"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {t.categories.modeSelected}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Layout Selector with Wireframes */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    {t.categories.layoutLabel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "grid_8", name: "Compact 8-Grid", desc: "4 cols mobile, 8 cols desktop" },
                      { id: "grid_4", name: "Spacious 4-Grid", desc: "Larger cards with 4 cols" },
                      { id: "carousel", name: "Swipe Carousel", desc: "Horizontal scroll row" },
                      { id: "rounded", name: "Rounded Badges", desc: "Circular story-style icons" },
                    ].map((ly) => (
                      <button
                        key={ly.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            categories: { ...prev.categories, layout: ly.id as never },
                          }))
                        }
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition ${
                          config.categories.layout === ly.id
                            ? "border-sale bg-sale/5 shadow-sm ring-1 ring-sale"
                            : "border-border bg-background hover:bg-secondary/50"
                        }`}
                      >
                        <span className="text-xs font-bold text-foreground">{ly.name}</span>
                        <span className="mt-1 text-[11px] text-muted-foreground leading-tight">
                          {ly.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Categories Toggle List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-foreground">
                      {t.categories.listLabel}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {config.categories.items.filter((c) => c.is_active).length} of{" "}
                      {config.categories.items.length} {t.status.itemsEnabled}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {config.categories.items.map((cat, idx) => {
                      const defaultImg =
                        defaultCategories.find(
                          (c) => c.name.toLowerCase() === cat.name.toLowerCase(),
                        )?.image || defaultCategories[0]?.image;

                      return (
                        <div
                          key={cat.id || cat.name}
                          className={`flex flex-col items-center justify-between rounded-xl border p-2.5 transition text-center ${
                            cat.is_active
                              ? "border-sale/40 bg-sale/[0.02]"
                              : "border-border bg-muted/30 opacity-60"
                          }`}
                        >
                          <div className="h-14 w-14 overflow-hidden rounded-lg bg-muted">
                            <img
                              src={cat.image || defaultImg}
                              alt={cat.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <span className="mt-2 text-xs font-semibold truncate max-w-full text-foreground">
                            {cat.name}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setConfig((prev) => {
                                const newItems = [...prev.categories.items];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  is_active: !newItems[idx].is_active,
                                };
                                return {
                                  ...prev,
                                  categories: { ...prev.categories, items: newItems },
                                };
                              });
                            }}
                            className={`mt-2.5 w-full rounded-md py-1 text-[10px] font-bold uppercase transition ${
                              cat.is_active
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                : "bg-muted text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {cat.is_active ? t.status.active : t.status.off}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PROMO ADVERTISEMENTS                                                */}
        {/* ========================================================================= */}
        {activeTab === "promo_strip" && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.promo.title}</h2>
                <p className="text-xs text-muted-foreground">{t.promo.desc}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newId = `promo-${Date.now()}`;
                    const newAd: PromoAdItem = {
                      id: newId,
                      title: lang === "bn" ? "নতুন আকর্ষণীয় অফার" : "Special Season Offer",
                      tag: lang === "bn" ? "স্পেশাল" : "Winter",
                      badge: "2026",
                      description: lang === "bn" ? "অনলাইন ও স্টোরে উপলব্ধ" : "Available in store & online",
                      image: "",
                      link: "/categories",
                      bg_color: "bg-brand-blush",
                      is_active: true,
                    };
                    setConfig((prev) => ({
                      ...prev,
                      promo_strip: {
                        ...prev.promo_strip,
                        items: [...prev.promo_strip.items, newAd],
                      },
                    }));
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-3 text-xs font-semibold text-white shadow-sm hover:bg-sale/90"
                >
                  <Plus className="h-4 w-4" /> {t.promo.addBtn}
                </button>

                {/* Section Toggle */}
                <label className="relative inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.promo_strip.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        promo_strip: { ...prev.promo_strip, enabled: e.target.checked },
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-sale peer-focus:outline-none after:absolute after:right-[23px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            {config.promo_strip.enabled && (
              <div className="space-y-4">
                {config.promo_strip.items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">{t.promo.noAds}</p>
                ) : (
                  config.promo_strip.items.map((ad, idx) => (
                    <div
                      key={ad.id}
                      className="rounded-xl border border-border bg-background p-4 sm:p-5 transition hover:border-sale/50 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-sale/10 text-xs font-bold text-sale">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sm text-foreground">
                            {ad.title || "Untitled"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], is_active: !items[idx].is_active };
                                return {
                                  ...prev,
                                  promo_strip: { ...prev.promo_strip, items },
                                };
                              });
                            }}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              ad.is_active
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {ad.is_active ? t.status.active : t.status.off}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t.toasts.deleteConfirm)) {
                                setConfig((prev) => ({
                                  ...prev,
                                  promo_strip: {
                                    ...prev.promo_strip,
                                    items: prev.promo_strip.items.filter((_, i) => i !== idx),
                                  },
                                }));
                              }
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t.promo.mainTitle}
                          </label>
                          <input
                            type="text"
                            value={ad.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], title: val };
                                return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t.promo.tagText}
                          </label>
                          <input
                            type="text"
                            value={ad.tag || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], tag: val };
                                return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t.promo.badgeText}
                          </label>
                          <input
                            type="text"
                            value={ad.badge || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], badge: val };
                                return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t.promo.linkText}
                          </label>
                          <input
                            type="text"
                            value={ad.link}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], link: val };
                                return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t.promo.bgText}
                          </label>
                          <select
                            value={ad.bg_color}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], bg_color: val };
                                return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          >
                            {TINTS.map((tint) => (
                              <option key={tint.value} value={tint.value}>
                                {tint.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            {t.promo.descText}
                          </label>
                          <input
                            type="text"
                            value={ad.description || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig((prev) => {
                                const items = [...prev.promo_strip.items];
                                items[idx] = { ...items[idx], description: val };
                                return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                              });
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          />
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          {t.promo.imageLabel}
                        </label>
                        <ImageUploader
                          value={ad.image}
                          onChange={(url) => {
                            setConfig((prev) => {
                              const items = [...prev.promo_strip.items];
                              items[idx] = { ...items[idx], image: url };
                              return { ...prev, promo_strip: { ...prev.promo_strip, items } };
                            });
                          }}
                          label={t.promo.uploadBtn}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TRENDING NOW                                                        */}
        {/* ========================================================================= */}
        {activeTab === "trending" && (
          <SectionConfigEditor
            lang={lang}
            t={t}
            title={t.tabs.trending}
            section={config.trending}
            onUpdate={(updated) => setConfig((prev) => ({ ...prev, trending: updated }))}
            availableProducts={availableProducts}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MID-PAGE BANNER                                                     */}
        {/* ========================================================================= */}
        {activeTab === "mid_banner" && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.midBanner.title}</h2>
                <p className="text-xs text-muted-foreground">{t.midBanner.desc}</p>
              </div>

              {/* Section Toggle */}
              <label className="relative inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.mid_banner.enabled}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      mid_banner: { ...prev.mid_banner, enabled: e.target.checked },
                    }))
                  }
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-sale peer-focus:outline-none after:absolute after:right-[23px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {config.mid_banner.enabled && (
              <div className="space-y-6">
                {config.mid_banner.banners.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="space-y-4 rounded-xl border border-border bg-background p-4 sm:p-5"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t.midBanner.tagLabel}
                        </label>
                        <input
                          type="text"
                          value={b.tag}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => {
                              const banners = [...prev.mid_banner.banners];
                              banners[idx] = { ...banners[idx], tag: val };
                              return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                            });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          placeholder="Winter"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t.midBanner.headlineLabel}
                        </label>
                        <input
                          type="text"
                          value={b.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => {
                              const banners = [...prev.mid_banner.banners];
                              banners[idx] = { ...banners[idx], title: val };
                              return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                            });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          placeholder="Collection"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t.midBanner.buttonLabel}
                        </label>
                        <input
                          type="text"
                          value={b.button_text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => {
                              const banners = [...prev.mid_banner.banners];
                              banners[idx] = { ...banners[idx], button_text: val };
                              return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                            });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          placeholder="SHOP NOW"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t.midBanner.linkLabel}
                        </label>
                        <input
                          type="text"
                          value={b.button_link}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => {
                              const banners = [...prev.mid_banner.banners];
                              banners[idx] = { ...banners[idx], button_link: val };
                              return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                            });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                          placeholder="/categories"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t.midBanner.alignLabel}
                        </label>
                        <select
                          value={b.align}
                          onChange={(e) => {
                            const val = e.target.value as "right" | "left" | "center";
                            setConfig((prev) => {
                              const banners = [...prev.mid_banner.banners];
                              banners[idx] = { ...banners[idx], align: val };
                              return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                            });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                        >
                          <option value="right">{t.midBanner.alignRight}</option>
                          <option value="left">{t.midBanner.alignLeft}</option>
                          <option value="center">{t.midBanner.alignCenter}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {t.midBanner.descLabel}
                        </label>
                        <input
                          type="text"
                          value={b.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConfig((prev) => {
                              const banners = [...prev.mid_banner.banners];
                              banners[idx] = { ...banners[idx], description: val };
                              return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                            });
                          }}
                          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                        />
                      </div>
                    </div>

                    {/* Banner Image Uploader */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        {t.midBanner.imageLabel}
                      </label>
                      <ImageUploader
                        value={b.image}
                        onChange={(url) => {
                          setConfig((prev) => {
                            const banners = [...prev.mid_banner.banners];
                            banners[idx] = { ...banners[idx], image: url };
                            return { ...prev, mid_banner: { ...prev.mid_banner, banners } };
                          });
                        }}
                        label={t.midBanner.uploadBtn}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MOST POPULAR PRODUCTS                                               */}
        {/* ========================================================================= */}
        {activeTab === "popular" && (
          <SectionConfigEditor
            lang={lang}
            t={t}
            title={t.tabs.popular}
            section={config.popular}
            onUpdate={(updated) => setConfig((prev) => ({ ...prev, popular: updated }))}
            availableProducts={availableProducts}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 6: MORE SECTIONS                                                       */}
        {/* ========================================================================= */}
        {activeTab === "extra_sections" && (
          <div className="space-y-6">
            <SectionConfigEditor
              lang={lang}
              t={t}
              title={lang === "bn" ? "এথনিক কালেকশন সেকশন" : "Ethnic Collection Section"}
              section={config.ethnic}
              onUpdate={(updated) => setConfig((prev) => ({ ...prev, ethnic: updated }))}
              availableProducts={availableProducts}
            />

            <SectionConfigEditor
              lang={lang}
              t={t}
              title={lang === "bn" ? "ফ্ল্যাশ সেল সেকশন" : "Flash Sale Section"}
              section={config.flash_sale}
              onUpdate={(updated) => setConfig((prev) => ({ ...prev, flash_sale: updated }))}
              availableProducts={availableProducts}
            />
          </div>
        )}
      </div>
    </AdminShell>
  );
}

/* ========================================================================= */
/* COMPREHENSIVE SECTION CONFIG EDITOR WITH WIREFRAME PREVIEWS & DIRECT PICKER*/
/* ========================================================================= */
function SectionConfigEditor({
  lang,
  t,
  title,
  section,
  onUpdate,
  availableProducts,
}: {
  lang: Lang;
  t: (typeof DICT)["en"];
  title: string;
  section: ProductSectionConfig;
  onUpdate: (updated: ProductSectionConfig) => void;
  availableProducts: Product[];
}) {
  const [search, setSearch] = useState("");

  const selectedIds = useMemo(() => section.selected_product_ids || [], [section.selected_product_ids]);

  const toggleProduct = (productId: string) => {
    const exists = selectedIds.includes(productId);
    const newIds = exists ? selectedIds.filter((id) => id !== productId) : [...selectedIds, productId];
    // If user picks a product, automatically switch source to 'selected'
    onUpdate({
      ...section,
      source: "selected",
      selected_product_ids: newIds,
    });
  };

  const removeProduct = (productId: string) => {
    onUpdate({
      ...section,
      selected_product_ids: selectedIds.filter((id) => id !== productId),
    });
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      {/* Header and Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {lang === "bn"
              ? "৫টি ভিজ্যুয়াল স্টাইল থেকে পছন্দ করুন এবং স্টোরের প্রোডাক্ট সরাসরি নির্বাচন করুন।"
              : "Choose from 5 visual layout styles and select products directly from your catalog."}
          </p>
        </div>

        {/* Section Enable Toggle */}
        <label className="relative inline-flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={section.is_active}
            onChange={(e) => onUpdate({ ...section, is_active: e.target.checked })}
            className="peer sr-only"
          />
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            {section.is_active ? t.status.enabled : t.status.disabled}
          </span>
          <div className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-sale peer-focus:outline-none after:absolute after:right-[23px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
        </label>
      </div>

      {section.is_active && (
        <div className="space-y-6 pt-2">
          {/* Section Header Text */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t.sections.headingLabel}
              </label>
              <input
                type="text"
                value={section.name}
                onChange={(e) => onUpdate({ ...section, name: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t.sections.actionLabel}
              </label>
              <input
                type="text"
                value={section.action_label || ""}
                onChange={(e) => onUpdate({ ...section, action_label: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {t.sections.maxLabel}
              </label>
              <input
                type="number"
                min={2}
                max={40}
                value={section.max_items || 8}
                onChange={(e) => onUpdate({ ...section, max_items: Number(e.target.value) || 8 })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* VISUAL WIREFRAME PREVIEWS FOR LAYOUT STYLES                       */}
          {/* ================================================================= */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-foreground">
                {t.sections.layoutLabel}
              </label>
              <span className="text-xs font-bold text-sale uppercase tracking-wider">
                {t.sections.activeStyle}: {section.layout}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. Carousel */}
              <LayoutOptionCard
                active={section.layout === "carousel"}
                onClick={() => onUpdate({ ...section, layout: "carousel" })}
                title={t.layouts.carousel.label}
                desc={t.layouts.carousel.desc}
              >
                <div className="flex items-center gap-1.5 overflow-hidden w-full py-2">
                  <div className="h-11 w-1/4 rounded-lg bg-sale/20 border border-sale/40 shrink-0 flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-sale/50 rounded-xs" />
                  </div>
                  <div className="h-11 w-1/4 rounded-lg bg-sale/20 border border-sale/40 shrink-0 flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-sale/50 rounded-xs" />
                  </div>
                  <div className="h-11 w-1/4 rounded-lg bg-sale/20 border border-sale/40 shrink-0 flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-sale/50 rounded-xs" />
                  </div>
                  <div className="h-11 w-1/4 rounded-lg bg-sale/20 border border-sale/40 shrink-0 flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-sale/50 rounded-xs" />
                  </div>
                </div>
                <div className="flex items-center justify-between w-full text-[10px] text-sale font-semibold">
                  <span>&larr; Swipe Scroll &rarr;</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-3 rounded-full bg-sale" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  </span>
                </div>
              </LayoutOptionCard>

              {/* 2. 3-Grid */}
              <LayoutOptionCard
                active={section.layout === "grid_3"}
                onClick={() => onUpdate({ ...section, layout: "grid_3" })}
                title={t.layouts.grid_3.label}
                desc={t.layouts.grid_3.desc}
              >
                <div className="grid grid-cols-3 gap-1.5 w-full py-2">
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                </div>
              </LayoutOptionCard>

              {/* 3. 4-Grid */}
              <LayoutOptionCard
                active={section.layout === "grid_4"}
                onClick={() => onUpdate({ ...section, layout: "grid_4" })}
                title={t.layouts.grid_4.label}
                desc={t.layouts.grid_4.desc}
              >
                <div className="grid grid-cols-4 gap-1.5 w-full py-2">
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                  <div className="h-11 rounded-lg bg-muted border border-border flex flex-col justify-end p-1">
                    <div className="h-1.5 w-full bg-muted-foreground/30 rounded-xs" />
                  </div>
                </div>
              </LayoutOptionCard>

              {/* 4. Featured Hero */}
              <LayoutOptionCard
                active={section.layout === "featured"}
                onClick={() => onUpdate({ ...section, layout: "featured" })}
                title={t.layouts.featured.label}
                desc={t.layouts.featured.desc}
              >
                <div className="grid grid-cols-5 gap-1.5 w-full py-2">
                  <div className="col-span-2 h-14 rounded-lg bg-sale/15 border-2 border-sale/60 flex flex-col justify-between p-1">
                    <span className="text-[8px] font-bold text-sale uppercase tracking-wider">HERO</span>
                    <div className="h-1.5 w-3/4 bg-sale/50 rounded-xs" />
                  </div>
                  <div className="col-span-3 grid grid-cols-2 gap-1 h-14">
                    <div className="h-6 rounded bg-muted border border-border" />
                    <div className="h-6 rounded bg-muted border border-border" />
                    <div className="h-6 rounded bg-muted border border-border" />
                    <div className="h-6 rounded bg-muted border border-border" />
                  </div>
                </div>
              </LayoutOptionCard>

              {/* 5. Two Column */}
              <LayoutOptionCard
                active={section.layout === "two_column"}
                onClick={() => onUpdate({ ...section, layout: "two_column" })}
                title={t.layouts.two_column.label}
                desc={t.layouts.two_column.desc}
              >
                <div className="grid grid-cols-2 gap-1.5 w-full py-2">
                  <div className="h-11 rounded-lg bg-muted border border-border flex items-center p-1 gap-1.5">
                    <div className="h-8 w-8 rounded bg-muted-foreground/20 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full bg-muted-foreground/30 rounded" />
                      <div className="h-1.5 w-1/2 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                  <div className="h-11 rounded-lg bg-muted border border-border flex items-center p-1 gap-1.5">
                    <div className="h-8 w-8 rounded bg-muted-foreground/20 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 w-full bg-muted-foreground/30 rounded" />
                      <div className="h-1.5 w-1/2 bg-muted-foreground/20 rounded" />
                    </div>
                  </div>
                </div>
              </LayoutOptionCard>
            </div>
          </div>

          {/* ================================================================= */}
          {/* DIRECT PRODUCT SELECTOR & HANDPICK SUITE                          */}
          {/* ================================================================= */}
          <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{t.sections.sourceLabel}</h3>
                <p className="text-xs text-muted-foreground">
                  {lang === "bn"
                    ? "স্বয়ংক্রিয়ভাবে দেখাবেন নাকি নিজের পছন্দের প্রোডাক্ট নির্বাচন করবেন তা নির্ধারণ করুন।"
                    : "Choose between automatic store display or handpicking specific items."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...section, source: "auto" })}
                  className={`h-9 rounded-xl px-4 text-xs font-bold transition ${
                    section.source === "auto"
                      ? "bg-sale text-white shadow-xs"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t.sections.sourceAuto}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...section, source: "selected" })}
                  className={`h-9 rounded-xl px-4 text-xs font-bold transition ${
                    section.source === "selected"
                      ? "bg-sale text-white shadow-xs"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {t.sections.sourceHandpick}
                </button>
              </div>
            </div>

            {/* Currently Selected Products Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">
                  {t.sections.selectedLabel} ({selectedIds.length} {t.status.selectedCount})
                </span>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...section, selected_product_ids: [] })}
                    className="text-[11px] text-destructive hover:underline"
                  >
                    {lang === "bn" ? "সব মুছুন" : "Clear all"}
                  </button>
                )}
              </div>

              {selectedIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedIds.map((id) => {
                    const prod = availableProducts.find((p) => p.id === id);
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-xl border border-sale/40 bg-sale/5 px-3 py-1.5 text-xs shadow-xs"
                      >
                        {prod?.image && (
                          <img src={prod.image} alt="" className="h-5 w-5 rounded object-cover" />
                        )}
                        <span className="font-semibold text-foreground truncate max-w-[160px]">
                          {prod?.name || id}
                        </span>
                        <span className="text-sale font-bold">৳{prod?.price || 0}</span>
                        <button
                          type="button"
                          onClick={() => removeProduct(id)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  {t.sections.noSelected}
                </p>
              )}
            </div>

            {/* Catalog Grid with Instant Search and Selection */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-foreground">
                  {t.sections.availableTitle}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.sections.searchPlaceholder}
                  className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-sale shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto p-1 [scrollbar-width:thin]">
                {availableProducts
                  .filter(
                    (p) =>
                      !search ||
                      p.name.toLowerCase().includes(search.toLowerCase()) ||
                      p.category?.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((product) => {
                    const isSelected = selectedIds.includes(product.id);

                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2 transition ${
                          isSelected
                            ? "border-sale bg-sale/10 shadow-xs ring-1 ring-sale"
                            : "border-border bg-card hover:border-sale/40 hover:bg-secondary/40"
                        }`}
                      >
                        <div
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                            isSelected
                              ? "border-sale bg-sale text-white"
                              : "border-muted-foreground/30 bg-background"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>

                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-semibold text-foreground">
                            {product.name}
                          </h4>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[60px]">{product.category || "General"}</span>
                            <span>•</span>
                            <span className="font-bold text-sale">৳{product.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* WIREFRAME PREVIEW CARD HELPER                                              */
/* ========================================================================= */
function LayoutOptionCard({
  active,
  onClick,
  title,
  desc,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition shadow-xs ${
        active
          ? "border-sale bg-sale/5 ring-2 ring-sale"
          : "border-border bg-background hover:bg-secondary/40 hover:border-sale/30"
      }`}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs sm:text-sm font-bold text-foreground">{title}</span>
        {active && (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-sale text-white shadow-xs">
            <Check className="h-3 w-3 stroke-[3]" />
          </span>
        )}
      </div>

      {/* Wireframe Graphic */}
      <div className="w-full my-1 rounded-xl bg-card border border-border/60 p-2">{children}</div>

      <span className="mt-1 text-[11px] text-muted-foreground leading-tight">{desc}</span>
    </button>
  );
}

/* ========================================================================= */
/* TAB BUTTON COMPONENT                                                      */
/* ========================================================================= */
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeTone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeTone?: "green" | "blue" | "amber" | "gray";
}) {
  const badgeCls =
    badgeTone === "green"
      ? "bg-emerald-500/10 text-emerald-600"
      : badgeTone === "blue"
        ? "bg-sky-500/10 text-sky-600"
        : badgeTone === "amber"
          ? "bg-amber-500/10 text-amber-600"
          : "bg-muted text-muted-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition whitespace-nowrap ${
        active
          ? "bg-sale text-white shadow-sm"
          : "border border-border bg-card text-foreground/80 hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            active ? "bg-white/20 text-white" : badgeCls
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
