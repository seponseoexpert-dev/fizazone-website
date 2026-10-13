"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FaqSectionConfig } from "@/lib/homepage-config";

interface HomeFaqSectionProps {
  faqConfig?: FaqSectionConfig;
}

const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "How long does delivery take for domestic and international orders?",
    answer:
      "Inside Dhaka, standard delivery takes 24–48 hours (express same-day available). Nationwide delivery across Bangladesh takes 2–3 business days. For international orders (USA, UK, Canada, Australia), DHL/FedEx express delivery takes 5–8 business days with real-time end-to-end tracking.",
    is_active: true,
  },
  {
    id: "faq-2",
    question: "Are all products at Faiza Zone authentic and quality checked?",
    answer:
      "Yes, 100% authentic. Every garment, accessory, and footwear item undergoes strict 3-tier quality inspection before dispatch. Our fabrics are sourced directly from certified textile mills and comply with international colorfastness and shrinkage standards.",
    is_active: true,
  },
  {
    id: "faq-3",
    question: "What payment methods are supported?",
    answer:
      "We support Cash on Delivery (COD) inside Bangladesh, bKash, Nagad, Rocket, Upay, Visa, MasterCard, and American Express. For international shoppers, we accept global credit/debit cards via secure 256-bit encrypted checkout.",
    is_active: true,
  },
  {
    id: "faq-4",
    question: "Can I exchange or return an item if the size does not fit?",
    answer:
      "Absolutely. We offer a hassle-free 7-day return and exchange policy. Simply initiate a return request from your account or contact our customer support via WhatsApp or email with your order ID.",
    is_active: true,
  },
  {
    id: "faq-5",
    question: "How do I choose the right size for Kurtis, Panjabis, or Shoes?",
    answer:
      "Each product page contains a detailed Size Chart with chest, length, shoulder, and sleeve measurements in inches and centimeters. If you are between sizes, we recommend sizing up for regular fit or checking our interactive Size Guide.",
    is_active: true,
  },
];

export function HomeFaqSection({ faqConfig }: HomeFaqSectionProps) {
  const rawItems = faqConfig?.items && faqConfig.items.length > 0 ? faqConfig.items : DEFAULT_FAQS;
  const items = rawItems.filter((it) => it.is_active !== false);

  // First item open by default for engaging preview
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    [items[0]?.id || "faq-1"]: true,
  });

  // If explicitly disabled in admin panel or no items, do not render
  if (faqConfig && faqConfig.enabled === false) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  const title = faqConfig?.title || "Frequently Asked Questions (FAQ)";
  const subtitle =
    faqConfig?.subtitle ||
    "Got questions? We've got answers. Explore our most common inquiries regarding orders, shipping, and products.";

  const toggle = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Google FAQ Schema JSON-LD for rich snippet ranking
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="shop-container py-10 sm:py-14" aria-labelledby="faq-section-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sale/10 px-3.5 py-1 text-xs font-bold text-sale tracking-wide uppercase mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help & Support</span>
          </div>
          <h2
            id="faq-section-heading"
            className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-2.5 max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {items.map((item, idx) => {
            const isOpen = Boolean(openIds[item.id]);

            return (
              <div
                key={item.id || `faq-${idx}`}
                className={`overflow-hidden rounded-xl border transition-all duration-200 ${
                  isOpen
                    ? "border-sale/40 bg-card shadow-sm ring-1 ring-sale/20"
                    : "border-border bg-card/60 hover:border-border/80 hover:bg-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                        isOpen ? "bg-sale text-white" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-foreground">
                      {item.question}
                    </span>
                  </span>
                  <div
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-200 ${
                      isOpen
                        ? "border-sale/30 bg-sale/10 text-sale rotate-180"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                <div
                  style={{ display: isOpen ? "block" : "none" }}
                  className="border-t border-border/40 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed sm:pl-14"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
