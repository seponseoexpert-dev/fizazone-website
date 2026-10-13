"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Code2,
  ExternalLink,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/admin-products";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  fetchHomepageConfig,
  saveHomepageConfig,
  type FaqItem,
  type HomepageConfig,
} from "@/lib/homepage-config";

export default function AdminFaqPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);

  // Form for new FAQ
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newActive, setNewActive] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchHomepageConfig();
      setConfig(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load FAQ settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      const ok = await isAdmin(data.user.id);
      setAllowed(ok);
      if (ok) {
        void loadData();
      } else {
        setLoading(false);
      }
    })();
  }, [loadData]);

  const handleSave = async (updatedConfig = config) => {
    setSaving(true);
    try {
      await saveHomepageConfig(updatedConfig);
      queryClient.setQueryData(["homepage-config"], updatedConfig);
      queryClient.invalidateQueries({ queryKey: ["homepage-config"] });
      toast.success("Homepage FAQ configuration saved successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save FAQs");
    } finally {
      setSaving(false);
    }
  };

  const faq = config.faq || DEFAULT_HOMEPAGE_CONFIG.faq!;
  const items = faq.items || [];

  const updateFaqSettings = (partial: Partial<typeof faq>) => {
    const updated: HomepageConfig = {
      ...config,
      faq: {
        ...faq,
        ...partial,
      },
    };
    setConfig(updated);
  };

  const handleToggleSection = () => {
    updateFaqSettings({ enabled: !faq.enabled });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please provide both a question and an answer");
      return;
    }

    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      is_active: newActive,
    };

    const nextItems = [...items, newItem];
    const updated: HomepageConfig = {
      ...config,
      faq: {
        ...faq,
        items: nextItems,
      },
    };
    setConfig(updated);
    setNewQuestion("");
    setNewAnswer("");
    setNewActive(true);
    setShowAddModal(false);
    toast.success("New FAQ added. Click 'Save All Changes' to apply.");
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const nextItems = items.map((it) => (it.id === editingItem.id ? editingItem : it));
    const updated: HomepageConfig = {
      ...config,
      faq: {
        ...faq,
        items: nextItems,
      },
    };
    setConfig(updated);
    setEditingItem(null);
    toast.success("FAQ updated. Click 'Save All Changes' to apply.");
  };

  const handleDeleteItem = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    const nextItems = items.filter((it) => it.id !== id);
    const updated: HomepageConfig = {
      ...config,
      faq: {
        ...faq,
        items: nextItems,
      },
    };
    setConfig(updated);
    toast.success("FAQ removed. Click 'Save All Changes' to apply.");
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    if (!moved) return;
    nextItems.splice(targetIndex, 0, moved);

    const updated: HomepageConfig = {
      ...config,
      faq: {
        ...faq,
        items: nextItems,
      },
    };
    setConfig(updated);
  };

  const handleToggleItemActive = (id: string) => {
    const nextItems = items.map((it) =>
      it.id === id ? { ...it, is_active: !it.is_active } : it
    );
    const updated: HomepageConfig = {
      ...config,
      faq: {
        ...faq,
        items: nextItems,
      },
    };
    setConfig(updated);
  };

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

  if (loading) {
    return (
      <AdminShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sale" />
          <p className="text-sm font-medium text-muted-foreground">Loading FAQs...</p>
        </div>
      </AdminShell>
    );
  }

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <AdminShell>
      <div className="space-y-6 pb-20">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sale/10 p-1.5 text-sale">
                <HelpCircle className="h-5 w-5" />
              </span>
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Homepage FAQ Management
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Add, edit, reorder, and customize questions & answers displayed directly under the SEO article on the homepage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-sale hover:text-sale"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Store
            </a>

            <button
              type="button"
              onClick={() => setShowSchemaPreview((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-sale hover:text-sale"
            >
              <Code2 className="h-3.5 w-3.5" /> Google Schema
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold text-foreground transition hover:bg-secondary/80"
            >
              <Plus className="h-3.5 w-3.5" /> Add New FAQ
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sale/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>

        {/* Google Schema Preview Card */}
        {showSchemaPreview && (
          <div className="rounded-xl border border-sale/40 bg-sale/5 p-4 text-xs">
            <div className="flex items-center justify-between pb-2 font-bold text-sale">
              <span>Google FAQPage JSON-LD Schema (Auto-generated)</span>
              <button onClick={() => setShowSchemaPreview(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-lg bg-background p-3 text-[11px] text-foreground font-mono">
              {JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: items
                    .filter((i) => i.is_active)
                    .map((i) => ({
                      "@type": "Question",
                      name: i.question,
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: i.answer,
                      },
                    })),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Section Global Settings Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">FAQ Section Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toggle visibility on homepage and customize the section heading and description.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {faq.enabled ? "Section Enabled" : "Section Disabled"}
              </span>
              <button
                type="button"
                onClick={handleToggleSection}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  faq.enabled ? "bg-sale" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    faq.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Section Title
              </label>
              <input
                type="text"
                value={faq.title}
                onChange={(e) => updateFaqSettings({ title: e.target.value })}
                placeholder="Frequently Asked Questions (FAQ)"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Section Subtitle / Description
              </label>
              <input
                type="text"
                value={faq.subtitle || ""}
                onChange={(e) => updateFaqSettings({ subtitle: e.target.value })}
                placeholder="Got questions? We've got answers."
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale"
              />
            </div>
          </div>
        </div>

        {/* Stats & Quick Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">
              Total Questions: {items.length}
            </span>
            <span className="rounded-full bg-sale/10 px-2.5 py-0.5 text-xs font-bold text-sale">
              {activeCount} Active on Store
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-3 text-xs font-bold text-white transition hover:bg-sale/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Question
          </button>
        </div>

        {/* FAQ Items List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold text-foreground">No questions added yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Add Question" to create your first frequently asked question.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-sale px-4 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add First FAQ
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                className={`group rounded-xl border bg-card p-4 transition-all ${
                  item.is_active
                    ? "border-border shadow-xs hover:border-sale/40"
                    : "border-dashed border-border/70 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">
                          {item.question}
                        </h3>
                        {!item.is_active && (
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  </div>

                  {/* Actions cluster */}
                  <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                      aria-label="Move question up"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, "down")}
                      aria-label="Move question down"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleItemActive(item.id)}
                      title={item.is_active ? "Click to hide on store" : "Click to show on store"}
                      className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                        item.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...item })}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-foreground hover:border-sale hover:text-sale"
                      title="Edit Question & Answer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40"
                      title="Delete Question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form
              onSubmit={handleAddItem}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground">
                  Add New Question & Answer
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. How do I track my order?"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Answer *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Provide a helpful, detailed answer for shoppers..."
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition focus:border-sale leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newActiveCheck"
                    checked={newActive}
                    onChange={(e) => setNewActive(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-border text-sale focus:ring-sale"
                  />
                  <label htmlFor="newActiveCheck" className="text-xs font-medium text-foreground cursor-pointer">
                    Display actively on storefront
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-sale px-4 text-xs font-bold text-white hover:bg-sale/90"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form
              onSubmit={handleUpdateItem}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-base font-bold text-foreground">
                  Edit Question & Answer
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Question *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.question}
                    onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Answer *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={editingItem.answer}
                    onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none transition focus:border-sale leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editActiveCheck"
                    checked={editingItem.is_active}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, is_active: e.target.checked })
                    }
                    className="h-4 w-4 rounded-sm border-border text-sale focus:ring-sale"
                  />
                  <label htmlFor="editActiveCheck" className="text-xs font-medium text-foreground cursor-pointer">
                    Display actively on storefront
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="h-9 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-sale px-4 text-xs font-bold text-white hover:bg-sale/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
