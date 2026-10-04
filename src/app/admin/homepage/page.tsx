"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/components/ui/link";
import {
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Grid,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  Megaphone,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Sparkles,
  Star,
  Tag,
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

const TINTS = [
  { label: "Blush Pink", value: "bg-brand-blush", preview: "#fde8e8" },
  { label: "Sky Blue", value: "bg-brand-sky", preview: "#e0f2fe" },
  { label: "Cool Slate", value: "bg-secondary", preview: "#f1f5f9" },
  { label: "Warm Amber", value: "bg-amber-500/10", preview: "#fef3c7" },
  { label: "Emerald Mint", value: "bg-emerald-500/10", preview: "#d1fae5" },
  { label: "Rose Coral", value: "bg-rose-500/10", preview: "#ffe4e6" },
  { label: "Indigo Violet", value: "bg-indigo-500/10", preview: "#e0e7ff" },
];

const LAYOUT_OPTIONS: {
  id: ProductSectionLayout;
  label: string;
  desc: string;
  iconName: string;
}[] = [
  {
    id: "carousel",
    label: "Horizontal Scroll (Carousel)",
    desc: "Swipeable slider with left/right arrows for touch and mobile friendliness",
    iconName: "carousel",
  },
  {
    id: "grid_3",
    label: "3 Products Per Line (3 Columns)",
    desc: "Spacious 3-column grid highlighting product details",
    iconName: "grid_3",
  },
  {
    id: "grid_4",
    label: "4 Products Per Line (4 Columns)",
    desc: "Standard modern e-commerce 4-column product grid",
    iconName: "grid_4",
  },
  {
    id: "featured",
    label: "Featured Hero + Side Grid",
    desc: "1 large highlight card on the left + 4 products on the right",
    iconName: "featured",
  },
  {
    id: "two_column",
    label: "2-Column Showcase",
    desc: "Prominent wide cards with details and quick action buttons",
    iconName: "two_column",
  },
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

  // Product Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  // Product List (from DB + fallback)
  const [availableProducts, setAvailableProducts] = useState<Product[]>(allProducts);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await fetchHomepageConfig();
      setConfig(cfg);

      // Also try fetching latest products from DB
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

          // Merge without duplicates
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
      toast.error("Could not load homepage configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        // Allow in development/preview or check admin
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
      toast.success("Homepage configuration saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save configuration";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all homepage settings to defaults?")) {
      setConfig(DEFAULT_HOMEPAGE_CONFIG);
      toast.info("Settings reset to defaults. Click 'Save Changes' to apply.");
    }
  };

  /* Helper to toggle product in a section's handpicked list */
  const toggleProductSelection = (sectionKey: string, productId: string) => {
    setConfig((prev) => {
      const updateSection = (sec: ProductSectionConfig) => {
        const currentIds = sec.selected_product_ids || [];
        const exists = currentIds.includes(productId);
        const newIds = exists
          ? currentIds.filter((id) => id !== productId)
          : [...currentIds, productId];
        return { ...sec, selected_product_ids: newIds };
      };

      if (sectionKey === "trending") {
        return { ...prev, trending: updateSection(prev.trending) };
      }
      if (sectionKey === "popular") {
        return { ...prev, popular: updateSection(prev.popular) };
      }
      if (sectionKey === "ethnic") {
        return { ...prev, ethnic: updateSection(prev.ethnic) };
      }
      if (sectionKey === "flash_sale") {
        return { ...prev, flash_sale: updateSection(prev.flash_sale) };
      }

      // Check extra sections
      const extras = prev.extra_sections.map((es) =>
        es.key === sectionKey || es.id === sectionKey ? updateSection(es) : es,
      );
      return { ...prev, extra_sections: extras };
    });
  };

  const getTargetSection = (key: string | null): ProductSectionConfig | null => {
    if (!key) return null;
    if (key === "trending") return config.trending;
    if (key === "popular") return config.popular;
    if (key === "ethnic") return config.ethnic;
    if (key === "flash_sale") return config.flash_sale;
    return config.extra_sections.find((s) => s.key === key || s.id === key) || null;
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sale" />
          <p className="text-sm font-medium text-muted-foreground">Loading Homepage Customizer...</p>
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
                Homepage Customizer &amp; Sections
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Configure homepage sections, categories, advertisements, trending layouts, and featured products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <Link
              to="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-sale"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Store
            </Link>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-sale px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-sale/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All Changes
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto border-b border-border pb-2 [scrollbar-width:none]">
          <TabButton
            active={activeTab === "categories"}
            onClick={() => setActiveTab("categories")}
            icon={<Layers className="h-4 w-4" />}
            label="Shop by Categories"
            badge={config.categories.enabled ? "Active" : "Off"}
            badgeTone={config.categories.enabled ? "green" : "gray"}
          />
          <TabButton
            active={activeTab === "promo_strip"}
            onClick={() => setActiveTab("promo_strip")}
            icon={<Megaphone className="h-4 w-4" />}
            label="Advertisements (বিজ্ঞাপন)"
            badge={`${config.promo_strip.items.filter((i) => i.is_active).length} Ads`}
            badgeTone={config.promo_strip.enabled ? "blue" : "gray"}
          />
          <TabButton
            active={activeTab === "trending"}
            onClick={() => setActiveTab("trending")}
            icon={<Flame className="h-4 w-4" />}
            label="Trending Now"
            badge={config.trending.is_active ? config.trending.layout : "Off"}
            badgeTone={config.trending.is_active ? "amber" : "gray"}
          />
          <TabButton
            active={activeTab === "mid_banner"}
            onClick={() => setActiveTab("mid_banner")}
            icon={<ImageIcon className="h-4 w-4" />}
            label="Promo Banner (বিজ্ঞাপন ব্যানার)"
            badge={config.mid_banner.enabled ? "Active" : "Off"}
            badgeTone={config.mid_banner.enabled ? "green" : "gray"}
          />
          <TabButton
            active={activeTab === "popular"}
            onClick={() => setActiveTab("popular")}
            icon={<Star className="h-4 w-4" />}
            label="Most Popular Products"
            badge={config.popular.is_active ? config.popular.layout : "Off"}
            badgeTone={config.popular.is_active ? "green" : "gray"}
          />
          <TabButton
            active={activeTab === "extra_sections"}
            onClick={() => setActiveTab("extra_sections")}
            icon={<Boxes className="h-4 w-4" />}
            label="More Sections"
          />
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SHOP BY CATEGORIES                                                  */}
        {/* ========================================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Category by Shop Management</h2>
                <p className="text-xs text-muted-foreground">
                  Enable/disable category section, choose display style, select all or handpick categories.
                </p>
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
                  {config.categories.enabled ? "Section Enabled" : "Section Disabled"}
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
                      Section Title (হোমপেজ হেডিং)
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
                      Category Display Mode (সিলেকশন মোড)
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
                        All Categories
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
                        Selected Categories Only
                      </button>
                    </div>
                  </div>
                </div>

                {/* Layout Selector */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Layout Style (ক্যাটাগরি প্রদর্শনের স্টাইল)
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
                      Categories ON/OFF &amp; Selection (ক্যাটাগরি অন-অফ নিয়ন্ত্রণ)
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {config.categories.items.filter((c) => c.is_active).length} of{" "}
                      {config.categories.items.length} enabled
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
                            {cat.is_active ? "Enabled" : "Disabled"}
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
        {/* TAB 2: PROMO ADVERTISEMENTS (বিজ্ঞাপন STRIP)                                */}
        {/* ========================================================================= */}
        {activeTab === "promo_strip" && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Advertisements Strip (বিজ্ঞাপন নিয়ন্ত্রণ)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Control promotional ad cards with custom text, images, badges, links, and multiple advertisements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newId = `promo-${Date.now()}`;
                    const newAd: PromoAdItem = {
                      id: newId,
                      title: "New Promotional Offer",
                      tag: "Special",
                      badge: "2026",
                      description: "Available in store & online",
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
                  <Plus className="h-4 w-4" /> Add Advertisement
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
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No advertisements added yet. Click &quot;Add Advertisement&quot; to create one.
                  </p>
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
                            {ad.title || "Untitled Ad"}
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
                            {ad.is_active ? "Active" : "Hidden"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Delete this advertisement?")) {
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
                            Main Title (বিজ্ঞাপনের মূল শিরোনাম)
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
                            placeholder="Exclusive for Man"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Script / Eyebrow Tag (ট্যাগ টেক্সট)
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
                            placeholder="Winter / Eid Special"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Badge / Year (ব্যাজ টেক্সট)
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
                            placeholder="2026-27 / Flat 30% OFF"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Target Link (ক্লিক করলে যেখানে যাবে)
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
                            placeholder="/categories?category=Men"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Background Color / Theme (ব্যাকগ্রাউন্ড কালার)
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
                            {TINTS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Subtitle / Description Note
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
                            placeholder="Available in store & online"
                          />
                        </div>
                      </div>

                      {/* Image Upload / URL */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Ad Image (বিজ্ঞাপনের ছবি আপলোড বা URL)
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
                          label="Upload Promo Image"
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
        {/* TAB 3: TRENDING NOW (TRENDY NOW)                                           */}
        {/* ========================================================================= */}
        {activeTab === "trending" && (
          <SectionConfigEditor
            title="Trending Now Section (ট্রেন্ডিং প্রোডাক্ট)"
            description="Configure section header, choose from 5 display styles (including horizontal scroll and 3-column grid), and handpick products."
            section={config.trending}
            onUpdate={(updated) => setConfig((prev) => ({ ...prev, trending: updated }))}
            onOpenPicker={() => {
              setPickerTarget("trending");
              setPickerOpen(true);
            }}
            availableProducts={availableProducts}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MID-PAGE PROMO BANNER (বিজ্ঞাপন ব্যানার)                             */}
        {/* ========================================================================= */}
        {activeTab === "mid_banner" && (
          <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Mid-Page Promo Banner (বিজ্ঞাপন ব্যানার)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Change or add mid-page callout banner with image, headline, button, and text alignments.
                </p>
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
                          Tag / Eyebrow Text (যেমন: Winter)
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
                          Headline Title (যেমন: Collection)
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
                          Button Text (বাটন টেক্সট)
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
                          Button Link (বাটন লিংক)
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
                          Text Alignment (টেক্সটের পজিশন)
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
                          <option value="right">Right Aligned (ডান পাশে)</option>
                          <option value="left">Left Aligned (বাম পাশে)</option>
                          <option value="center">Centered (মাঝখানে)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Description (বিবরণ)
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
                          placeholder="Insulated layers, heavy knits and weather-ready outerwear."
                        />
                      </div>
                    </div>

                    {/* Banner Image Uploader */}
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Banner Image (ব্যানার ছবি আপলোড বা URL)
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
                        label="Upload Banner Image"
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
            title="Most Popular Products Section (জনপ্রিয় প্রোডাক্ট)"
            description="Toggle section, choose from 5 display styles, and handpick popular products."
            section={config.popular}
            onUpdate={(updated) => setConfig((prev) => ({ ...prev, popular: updated }))}
            onOpenPicker={() => {
              setPickerTarget("popular");
              setPickerOpen(true);
            }}
            availableProducts={availableProducts}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 6: MORE SECTIONS (Ethnic, Flash Sale, Custom)                         */}
        {/* ========================================================================= */}
        {activeTab === "extra_sections" && (
          <div className="space-y-6">
            <SectionConfigEditor
              title="Ethnic Collection Section"
              description="Configure ethnic collection products and display style."
              section={config.ethnic}
              onUpdate={(updated) => setConfig((prev) => ({ ...prev, ethnic: updated }))}
              onOpenPicker={() => {
                setPickerTarget("ethnic");
                setPickerOpen(true);
              }}
              availableProducts={availableProducts}
            />

            <SectionConfigEditor
              title="Flash Sale Section"
              description="Configure flash sale showcase section."
              section={config.flash_sale}
              onUpdate={(updated) => setConfig((prev) => ({ ...prev, flash_sale: updated }))}
              onOpenPicker={() => {
                setPickerTarget("flash_sale");
                setPickerOpen(true);
              }}
              availableProducts={availableProducts}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRODUCT PICKER MODAL                                                      */}
      {/* ========================================================================= */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Select Products for{" "}
                  <span className="text-sale">
                    {getTargetSection(pickerTarget)?.name || "Section"}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Check items to show in this section. Handpicked products will display in the chosen layout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="border-b border-border p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search products by name or category..."
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs sm:text-sm outline-none focus:border-sale"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProducts
                  .filter(
                    (p) =>
                      !pickerSearch ||
                      p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                      p.category?.toLowerCase().includes(pickerSearch.toLowerCase()),
                  )
                  .map((product) => {
                    const targetSec = getTargetSection(pickerTarget);
                    const isSelected =
                      targetSec?.selected_product_ids?.includes(product.id) || false;

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (pickerTarget) {
                            toggleProductSelection(pickerTarget, product.id);
                          }
                        }}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                          isSelected
                            ? "border-sale bg-sale/5 shadow-sm"
                            : "border-border bg-background hover:bg-secondary/40"
                        }`}
                      >
                        <div
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                            isSelected
                              ? "border-sale bg-sale text-white"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>

                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{product.category || "General"}</span>
                            <span>•</span>
                            <span className="font-semibold text-sale">৳{product.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Selected:{" "}
                <strong className="text-foreground">
                  {getTargetSection(pickerTarget)?.selected_product_ids?.length || 0}
                </strong>{" "}
                products
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded-lg bg-sale px-5 py-2 text-xs font-semibold text-white shadow hover:bg-sale/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

/* ========================================================================= */
/* REUSABLE SECTION CONFIG EDITOR COMPONENT                                   */
/* ========================================================================= */
function SectionConfigEditor({
  title,
  description,
  section,
  onUpdate,
  onOpenPicker,
  availableProducts,
}: {
  title: string;
  description: string;
  section: ProductSectionConfig;
  onUpdate: (updated: ProductSectionConfig) => void;
  onOpenPicker: () => void;
  availableProducts: Product[];
}) {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
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
            {section.is_active ? "Section Enabled" : "Section Disabled"}
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
                Section Heading (শিরোনাম)
              </label>
              <input
                type="text"
                value={section.name}
                onChange={(e) => onUpdate({ ...section, name: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
                placeholder="Trending Now"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Action Button Text (বাটন টেক্সট)
              </label>
              <input
                type="text"
                value={section.action_label || ""}
                onChange={(e) => onUpdate({ ...section, action_label: e.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
                placeholder="View all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Max Products to Show (সর্বোচ্চ প্রোডাক্ট সংখ্যা)
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

          {/* 3-4 Layout Styles requested by user */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">
                Display Style &amp; Layout (প্রদর্শনের স্টাইল নির্বাচন করুন)
              </label>
              <span className="text-xs font-bold text-sale uppercase tracking-wider">
                Active Style: {section.layout}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LAYOUT_OPTIONS.map((lo) => (
                <button
                  key={lo.id}
                  type="button"
                  onClick={() => onUpdate({ ...section, layout: lo.id })}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                    section.layout === lo.id
                      ? "border-sale bg-sale/5 shadow-sm ring-1 ring-sale"
                      : "border-border bg-background hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      {lo.label}
                    </span>
                    {section.layout === lo.id && (
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-sale text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-[11px] text-muted-foreground leading-snug">
                    {lo.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Source & Selection */}
          <div className="rounded-xl border border-border/80 bg-background p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Product Source (প্রোডাক্ট নির্বাচন পদ্ধতি)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Choose auto selection or pick custom products from store catalog.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate({ ...section, source: "auto" })}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                    section.source === "auto"
                      ? "bg-sale text-white"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Auto / All
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ ...section, source: "selected" })}
                  className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                    section.source === "selected"
                      ? "bg-sale text-white"
                      : "border border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Handpick Products
                </button>
              </div>
            </div>

            {section.source === "selected" && (
              <div className="border-t border-border pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Selected products:{" "}
                    <strong className="text-foreground">
                      {section.selected_product_ids?.length || 0}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenPicker}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sale/10 px-3 py-1.5 text-xs font-semibold text-sale hover:bg-sale hover:text-white transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Select / Edit Products
                  </button>
                </div>

                {/* Selected Products Preview Chips */}
                {section.selected_product_ids && section.selected_product_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {section.selected_product_ids.map((id) => {
                      const prod = availableProducts.find((p) => p.id === id);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1 text-xs"
                        >
                          {prod?.image && (
                            <img
                              src={prod.image}
                              alt=""
                              className="h-5 w-5 rounded object-cover"
                            />
                          )}
                          <span className="font-medium text-foreground truncate max-w-[140px]">
                            {prod?.name || id}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newIds = section.selected_product_ids?.filter((i) => i !== id);
                              onUpdate({ ...section, selected_product_ids: newIds });
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No products selected yet. Click &quot;Select / Edit Products&quot; to pick products.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
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
