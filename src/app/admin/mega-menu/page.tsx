"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Loader2,
  Menu,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  DEFAULT_MEGA_MENU_ITEMS,
  useMegaMenuConfig,
  type MegaMenuItem,
  type MegaMenuColumn,
  type MegaMenuSubLink,
} from "@/lib/mega-menu-config";
import { fetchCategories, fetchCategoryTranslations, type CategoryRow, type CategoryTranslation } from "@/lib/translations";
import { Link } from "@/components/ui/link";

export default function AdminMegaMenuPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const { items: initialItems, isLoading, saveConfig, isSaving } = useMegaMenuConfig();

  const [menuItems, setMenuItems] = useState<MegaMenuItem[]>(DEFAULT_MEGA_MENU_ITEMS);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [livePreviewOpen, setLivePreviewOpen] = useState(true);

  // Available catalogue categories from database
  const [dbCategories, setDbCategories] = useState<{ slug: string; name: string }[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setAllowed(false);
        return;
      }
      const ok = await isAdmin(data.user.id);
      setAllowed(ok);

      if (ok) {
        try {
          const [cats, trans] = await Promise.all([fetchCategories(), fetchCategoryTranslations()]);
          const list = cats.map((c) => {
            const tr = trans.find((t) => t.category_id === c.id && t.country_code === "bd");
            return {
              slug: c.base_slug,
              name: tr?.name || c.base_slug,
            };
          });
          setDbCategories(list);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setMenuItems(initialItems);
      if (!activeTabId && initialItems[0]) {
        setActiveTabId(initialItems[0].id);
      }
    }
  }, [initialItems]);

  const activeTab = useMemo(() => {
    return menuItems.find((m) => m.id === activeTabId) || menuItems[0] || null;
  }, [menuItems, activeTabId]);

  // Tab operations
  const addTab = () => {
    const id = `tab-${Date.now()}`;
    const newTab: MegaMenuItem = {
      id,
      label: `New Menu ${menuItems.length + 1}`,
      category: "Men",
      image: "/assets/hero-style-men.jpg",
      is_active: true,
      columns: [
        {
          id: `col-${Date.now()}-1`,
          title: "Popular Categories",
          links: [{ id: `link-${Date.now()}-1`, label: "All Items", category: "Men" }],
        },
      ],
    };
    setMenuItems((prev) => [...prev, newTab]);
    setActiveTabId(id);
    setHasChanges(true);
    toast.success("Added new main menu tab");
  };

  const updateActiveTab = (patch: Partial<MegaMenuItem>) => {
    if (!activeTab) return;
    setMenuItems((prev) =>
      prev.map((item) => (item.id === activeTab.id ? { ...item, ...patch } : item))
    );
    setHasChanges(true);
  };

  const removeTab = (tabId: string) => {
    if (menuItems.length <= 1) {
      toast.error("At least one main menu item must remain");
      return;
    }
    const filtered = menuItems.filter((m) => m.id !== tabId);
    setMenuItems(filtered);
    if (activeTabId === tabId) {
      setActiveTabId(filtered[0]?.id || "");
    }
    setHasChanges(true);
    toast.success("Main menu item removed");
  };

  const moveTab = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;
    const next = [...menuItems];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setMenuItems(next);
    setHasChanges(true);
  };

  // Column operations
  const addColumn = () => {
    if (!activeTab) return;
    const newCol: MegaMenuColumn = {
      id: `col-${Date.now()}`,
      title: "New Column",
      links: [{ id: `link-${Date.now()}-1`, label: "Sample Link", category: activeTab.category }],
    };
    updateActiveTab({ columns: [...activeTab.columns, newCol] });
    toast.success("Added new column");
  };

  const updateColumn = (colId: string, patch: Partial<MegaMenuColumn>) => {
    if (!activeTab) return;
    const nextCols = activeTab.columns.map((col) =>
      col.id === colId ? { ...col, ...patch } : col
    );
    updateActiveTab({ columns: nextCols });
  };

  const removeColumn = (colId: string) => {
    if (!activeTab) return;
    if (activeTab.columns.length <= 1) {
      toast.error("A mega menu tab must have at least one column");
      return;
    }
    const nextCols = activeTab.columns.filter((c) => c.id !== colId);
    updateActiveTab({ columns: nextCols });
    toast.success("Column removed");
  };

  const moveColumn = (colIndex: number, direction: "up" | "down") => {
    if (!activeTab) return;
    const targetIndex = direction === "up" ? colIndex - 1 : colIndex + 1;
    if (targetIndex < 0 || targetIndex >= activeTab.columns.length) return;
    const nextCols = [...activeTab.columns];
    const [moved] = nextCols.splice(colIndex, 1);
    nextCols.splice(targetIndex, 0, moved);
    updateActiveTab({ columns: nextCols });
  };

  // Sub-link operations
  const addLink = (colId: string, label = "New Category", category = activeTab?.category || "Men") => {
    if (!activeTab) return;
    const col = activeTab.columns.find((c) => c.id === colId);
    if (!col) return;
    const newLink: MegaMenuSubLink = {
      id: `link-${Date.now()}`,
      label,
      category,
    };
    updateColumn(colId, { links: [...col.links, newLink] });
    toast.success(`Added link to "${col.title}"`);
  };

  const updateLink = (colId: string, linkId: string, patch: Partial<MegaMenuSubLink>) => {
    if (!activeTab) return;
    const col = activeTab.columns.find((c) => c.id === colId);
    if (!col) return;
    const nextLinks = col.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l));
    updateColumn(colId, { links: nextLinks });
  };

  const removeLink = (colId: string, linkId: string) => {
    if (!activeTab) return;
    const col = activeTab.columns.find((c) => c.id === colId);
    if (!col) return;
    const nextLinks = col.links.filter((l) => l.id !== linkId);
    updateColumn(colId, { links: nextLinks });
  };

  const moveLink = (colId: string, linkIndex: number, direction: "up" | "down") => {
    if (!activeTab) return;
    const col = activeTab.columns.find((c) => c.id === colId);
    if (!col) return;
    const targetIndex = direction === "up" ? linkIndex - 1 : linkIndex + 1;
    if (targetIndex < 0 || targetIndex >= col.links.length) return;
    const nextLinks = [...col.links];
    const [moved] = nextLinks.splice(linkIndex, 1);
    nextLinks.splice(targetIndex, 0, moved);
    updateColumn(colId, { links: nextLinks });
  };

  // Save handler
  const handleSave = async () => {
    try {
      const ok = await saveConfig(menuItems);
      if (ok) {
        setHasChanges(false);
        toast.success("Mega Menu updated successfully! Changes are live on the store.");
      } else {
        toast.error("Failed to save Mega Menu settings");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving");
    }
  };

  const handleResetToDefault = () => {
    if (!confirm("Reset Mega Menu to default settings?")) return;
    setMenuItems(DEFAULT_MEGA_MENU_ITEMS);
    setActiveTabId(DEFAULT_MEGA_MENU_ITEMS[0]?.id || "");
    setHasChanges(true);
    toast.info("Reset to default. Click Save to persist.");
  };

  const filteredDbCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return dbCategories;
    return dbCategories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [dbCategories, categorySearch]);

  if (allowed === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Admins only</h1>
          <button
            onClick={() => router.push("/")}
            className="mt-5 h-10 rounded-lg bg-sale px-5 text-sm font-semibold text-primary-foreground"
          >
            Back to store
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-sale/10 px-2.5 py-1 text-xs font-bold text-sale">
                Navigation & Header
              </span>
              {hasChanges && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Unsaved Changes
                </span>
              )}
            </div>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Mega Menu & Category Customizer
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Add, rearrange and fully customize the top header menu tabs, columns, sub-links, and promo images.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLivePreviewOpen(!livePreviewOpen)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold hover:border-sale transition-colors"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
              {livePreviewOpen ? "Hide Live Preview" : "Show Live Preview"}
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sale px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all active:scale-95 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </header>

        {/* Live Interactive Storefront Preview */}
        {livePreviewOpen && activeTab && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Eye className="h-3.5 w-3.5 text-sale" /> Live Storefront Header Preview
              </span>
              <span className="text-[11px] text-muted-foreground">
                Active hover tab: <strong className="text-foreground">{activeTab.label}</strong>
              </span>
            </div>

            <div className="p-4 bg-background">
              {/* Header Navigation bar */}
              <div className="border border-border rounded-xl bg-background overflow-hidden">
                <div className="flex items-center justify-center gap-8 py-3 border-b border-border">
                  {menuItems.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={`text-xs font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 ${
                        activeTabId === tab.id
                          ? "border-sale text-sale"
                          : "border-transparent text-foreground/80 hover:text-sale"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Dropdown Mega Menu drawer */}
                <div className="grid grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-8 p-6 bg-card/40">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={activeTab.image}
                      alt={activeTab.label}
                      className="h-[240px] w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/hero-style-men.jpg";
                      }}
                    />
                    <div className="p-2 bg-secondary text-center text-[11px] font-bold truncate">
                      {activeTab.label} Banner
                    </div>
                  </div>

                  {activeTab.columns.map((col) => (
                    <div key={col.id} className="min-w-0">
                      <h4 className="border-b border-border pb-2 text-sm font-bold text-foreground">
                        {col.title}
                      </h4>
                      <ul className="mt-3 space-y-2">
                        {col.links.map((link) => (
                          <li key={link.id} className="text-xs text-muted-foreground hover:text-sale truncate flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-sale" />
                            {link.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top-Level Main Menu Tabs Manager */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                1. Main Menu Tabs (Top Level)
              </h2>
              <p className="text-xs text-muted-foreground">
                Drag or reorder tabs, edit tab name, promo banner image, and default category query.
              </p>
            </div>
            <button
              type="button"
              onClick={addTab}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-3 text-xs font-bold text-primary-foreground shadow-xs active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Add Main Tab
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
            {menuItems.map((tab, idx) => {
              const isSelected = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className={`group flex items-center gap-1 rounded-xl border p-1.5 transition-all ${
                    isSelected
                      ? "border-sale bg-sale/10 shadow-xs"
                      : "border-border bg-card hover:border-sale/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-foreground"
                  >
                    <span className="h-2 w-2 rounded-full bg-sale" />
                    {tab.label}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({tab.columns.length} cols)
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 border-l border-border/80 pl-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTab(idx, "left")}
                      title="Move Left"
                      className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === menuItems.length - 1}
                      onClick={() => moveTab(idx, "right")}
                      title="Move Right"
                      className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTab(tab.id)}
                      title="Delete Tab"
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Selected Tab Detailed Settings */}
        {activeTab && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column: Tab metadata & Banner image */}
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-sm font-bold text-foreground border-b border-border pb-3 flex items-center justify-between">
                <span>Tab Settings: {activeTab.label}</span>
                <span className="text-[10px] uppercase font-bold text-sale bg-sale/10 px-2 py-0.5 rounded">
                  Selected
                </span>
              </h3>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Menu Tab Label
                </label>
                <input
                  value={activeTab.label}
                  onChange={(e) => updateActiveTab({ label: e.target.value })}
                  placeholder="e.g. Men, Women, Juniors, Eid Special"
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold outline-none focus:border-sale"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Category Slug
                </label>
                <input
                  value={activeTab.category}
                  onChange={(e) => updateActiveTab({ category: e.target.value })}
                  placeholder="e.g. Men, Kurti, Panjabi, Boys"
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-sale"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Banner Promo Image URL
                </label>
                <input
                  value={activeTab.image}
                  onChange={(e) => updateActiveTab({ image: e.target.value })}
                  placeholder="/assets/hero-style-men.jpg or https://..."
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-sale"
                />

                <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
                  <img
                    src={activeTab.image}
                    alt={activeTab.label}
                    className="h-36 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/hero-style-men.jpg";
                    }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <ImageUploader
                  label="Upload Custom Banner Image"
                  folder="mega-menu"
                  value={activeTab.image}
                  onChange={(url) => updateActiveTab({ image: url })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="checkbox"
                  id="tab-active"
                  checked={activeTab.is_active}
                  onChange={(e) => updateActiveTab({ is_active: e.target.checked })}
                  className="h-4 w-4 accent-sale"
                />
                <label htmlFor="tab-active" className="text-xs font-semibold text-foreground cursor-pointer">
                  Show "{activeTab.label}" in Header Menu
                </label>
              </div>

              {/* Quick Catalogue Categories Explorer */}
              <div className="rounded-xl border border-border/80 bg-background/60 p-3 mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Store Categories</span>
                  <span className="text-[10px] text-sale">{dbCategories.length} available</span>
                </h4>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-2 text-xs outline-none focus:border-sale"
                  />
                </div>

                <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {filteredDbCategories.map((c) => (
                    <div
                      key={c.slug}
                      className="flex items-center justify-between rounded-md border border-border/50 bg-card p-2 text-xs hover:border-sale transition-colors"
                    >
                      <span className="font-semibold truncate">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab.columns.length > 0) {
                            addLink(activeTab.columns[0]!.id, c.name, c.slug);
                          } else {
                            toast.error("Please add a column first");
                          }
                        }}
                        className="rounded bg-sale/10 px-2 py-0.5 text-[10px] font-bold text-sale hover:bg-sale hover:text-white transition-colors"
                      >
                        + Add to Column
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right two columns: Columns and Sub-links Manager */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    2. Mega Menu Columns & Sub-Links
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Columns appear horizontally in the dropdown. Add sub-categories, edit labels, or reorder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addColumn}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-3 text-xs font-bold text-primary-foreground shadow-xs active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Column
                </button>
              </div>

              {/* Columns grid */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activeTab.columns.map((col, colIdx) => (
                  <div
                    key={col.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-xs"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                          {colIdx + 1}
                        </span>
                        <input
                          value={col.title}
                          onChange={(e) => updateColumn(col.id, { title: e.target.value })}
                          className="h-7 w-32 rounded border border-transparent bg-transparent px-1 text-sm font-bold text-foreground outline-none hover:border-border focus:border-sale focus:bg-background"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={colIdx === 0}
                          onClick={() => moveColumn(colIdx, "up")}
                          title="Move Column Left/Up"
                          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={colIdx === activeTab.columns.length - 1}
                          onClick={() => moveColumn(colIdx, "down")}
                          title="Move Column Right/Down"
                          className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColumn(col.id)}
                          title="Delete Column"
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-links List */}
                    <div className="flex-1 space-y-2">
                      {col.links.map((link, linkIdx) => (
                        <div
                          key={link.id}
                          className="group rounded-xl border border-border/80 bg-background/80 p-2.5 transition-all hover:border-sale/60"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <input
                                value={link.label}
                                onChange={(e) =>
                                  updateLink(col.id, link.id, { label: e.target.value })
                                }
                                placeholder="Link Label (e.g. Hoodies)"
                                className="h-7 w-full rounded border border-border/70 bg-card px-2 text-xs font-semibold outline-none focus:border-sale"
                              />
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={link.category}
                                  onChange={(e) =>
                                    updateLink(col.id, link.id, { category: e.target.value })
                                  }
                                  placeholder="Category (e.g. Men)"
                                  className="h-6 flex-1 rounded border border-border/70 bg-card px-2 text-[11px] text-muted-foreground outline-none focus:border-sale"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={linkIdx === 0}
                                onClick={() => moveLink(col.id, linkIdx, "up")}
                                className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={linkIdx === col.links.length - 1}
                                onClick={() => moveLink(col.id, linkIdx, "down")}
                                className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeLink(col.id, link.id)}
                                className="rounded p-1 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Link Button */}
                    <button
                      type="button"
                      onClick={() => addLink(col.id)}
                      className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-sale hover:text-sale transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
