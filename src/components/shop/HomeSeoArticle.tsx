"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useMarketPrefix } from "@/lib/market-link";
import type { SeoArticleSectionConfig } from "@/lib/homepage-config";

interface HomeSeoArticleProps {
  config?: SeoArticleSectionConfig;
}

export function HomeSeoArticle({ config }: HomeSeoArticleProps) {
  const [expanded, setExpanded] = useState(false);
  const market = useMarketPrefix();

  // If section is explicitly disabled by admin, don't render
  if (config && config.enabled === false) {
    return null;
  }

  // Sanitize trust badge to ensure no numbers are accidentally displayed
  const rawTrust = config?.badge_trust || "Trusted by Shopping Warehouses";
  const badgeTrust =
    rawTrust.includes("120,000") || rawTrust.includes("2000+")
      ? "Trusted by Shopping Warehouses"
      : rawTrust;

  const badgeLabel = config?.badge_label || "Online Fashion Guide";
  const headingTitle =
    config?.title ||
    "Faiza Zone — The Premier Online Fashion & Lifestyle Shopping Destination in Bangladesh";
  const previewText =
    config?.preview_text ||
    "Looking for authentic, trendsetting clothing with guaranteed fabric quality and affordable pricing? Faiza Zone is Bangladesh's leading e-commerce platform offering an exquisite fusion of traditional South Asian ethnic fashion and contemporary global streetwear.";

  const readMoreLabel = config?.read_more_label || "Read More";
  const showLessLabel = config?.show_less_label || "Show Less";

  const sec1Title =
    config?.section_1_title ||
    "Curated Ethnic Wear: Elegant Kurtis, Panjabis & Festive Attire";
  const sec1Body = config?.section_1_body;

  const sec2Title =
    config?.section_2_title ||
    "Modern Everyday Styles: Hoodies, Tees, Denim & Footwear";
  const sec2Body = config?.section_2_body;

  const sec3Title =
    config?.section_3_title ||
    "Transparent Shopping, Express Nationwide Delivery & Global Dispatch";
  const sec3Body = config?.section_3_body;

  const customContent = config?.custom_content?.trim();

  return (
    <section
      aria-label="About Faiza Zone Online Shopping"
      className="shop-container my-8 lg:my-12 px-3 sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card via-card/90 to-muted/20 p-4 sm:p-6 md:p-7 shadow-xs transition-all duration-300">
        {/* Header Badges - Fully Responsive Wrap (No Numbers in Trust Badge) */}
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sale/10 px-3 py-1 text-xs font-semibold text-sale">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{badgeLabel}</span>
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{badgeTrust}</span>
          </span>
        </div>

        {/* SEO Main Heading */}
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-foreground break-words leading-snug">
          {headingTitle}
        </h2>

        {/* First Line Summary Preview (Always Visible for SEO & Mobile Scannability) */}
        <div className="mt-2.5 text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground break-words">
          <p>
            {previewText}{" "}
            {!expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex cursor-pointer items-center gap-1 font-semibold text-sale hover:underline ml-1"
              >
                {readMoreLabel} <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </p>
        </div>

        {/* Action Button Row - Mobile Column, Desktop Row */}
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-border/40 pt-3">
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            {expanded
              ? "Showing complete shopping guide and product details"
              : "Click below to read full shopping guide & fashion details"}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-controls="seo-article-content"
            className="inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-sale/40 bg-sale/10 px-4 py-2 text-xs font-bold text-sale transition-all duration-200 hover:bg-sale hover:text-white sm:text-sm shrink-0"
          >
            {expanded ? (
              <>
                {showLessLabel} <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                {readMoreLabel} <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Collapsible Article Content (Rendered in DOM for SEO crawlability) */}
        <div
          id="seo-article-content"
          style={{ display: expanded ? "block" : "none" }}
          className="mt-4 space-y-4 sm:space-y-5 border-t border-border/60 pt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground break-words"
        >
          {customContent ? (
            <div className="space-y-3 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {customContent}
            </div>
          ) : (
            <>
              {/* Section 1 */}
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  {sec1Title}
                </h3>
                <p className="mt-1">
                  {sec1Body || (
                    <>
                      Whether dressing up for festive celebrations, weddings, or everyday corporate elegance, our handcrafted{" "}
                      <Link
                        href={`/${market}/categories?category=Kurti`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        designer kurti collection
                      </Link>{" "}
                      features breathable cotton, georgette, and intricate embroidery. For gentlemen, explore our signature{" "}
                      <Link
                        href={`/${market}/categories?category=Panjabi`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        mens panjabi range
                      </Link>
                      , tailor-fitted from premium jacquard, linen, and pure combed cotton to deliver unmatched comfort and royal poise.
                    </>
                  )}
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  {sec2Title}
                </h3>
                <p className="mt-1">
                  {sec2Body || (
                    <>
                      From cozy fleece-lined winter hoodies and athletic joggers to heavyweight{" "}
                      <Link
                        href={`/${market}/categories?category=Men`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        mens streetwear
                      </Link>{" "}
                      and chic{" "}
                      <Link
                        href={`/${market}/categories?category=Women`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        womens western apparel
                      </Link>
                      , each garment complies with internationally recognized textile quality and skin-friendly standards like{" "}
                      <a
                        href="https://www.oeko-tex.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-foreground underline decoration-border hover:text-sale"
                      >
                        OEKO-TEX® certifications <ExternalLink className="h-3 w-3 inline" />
                      </a>
                      . Match your outfit with durable{" "}
                      <Link
                        href={`/${market}/categories?category=Pants`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        gabardine trousers
                      </Link>{" "}
                      and versatile backpacks designed for active urban living.
                    </>
                  )}
                </p>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  {sec3Title}
                </h3>
                <p className="mt-1">
                  {sec3Body || (
                    <>
                      Enjoy seamless shopping with door-to-door Cash on Delivery (COD) across Dhaka, Chattogram, Sylhet, and every district in Bangladesh, alongside fast DHL/FedEx worldwide delivery to the USA, UK, Canada, and Australia. Every transaction is guarded with bank-grade encryption certified under{" "}
                      <a
                        href="https://www.pcisecuritystandards.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-foreground underline decoration-border hover:text-sale"
                      >
                        PCI-DSS security benchmarks <ExternalLink className="h-3 w-3 inline" />
                      </a>
                      . Need help selecting the right size? Consult our comprehensive{" "}
                      <Link
                        href={`/${market}/size-guide`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        Size Guide
                      </Link>
                      , track your shipment in real-time via{" "}
                      <Link
                        href={`/${market}/track-order`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        Track Order
                      </Link>
                      , or take advantage of our guaranteed{" "}
                      <Link
                        href={`/${market}/return-policy`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        7-Day Easy Return Policy
                      </Link>
                      . For dedicated assistance, our{" "}
                      <Link
                        href={`/${market}/contact`}
                        className="font-medium text-sale underline decoration-sale/30 underline-offset-2 hover:decoration-sale"
                      >
                        customer support team
                      </Link>{" "}
                      is available 7 days a week to ensure a 5-star shopping experience.
                    </>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Close / Collapse button at bottom of article */}
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex cursor-pointer items-center gap-1 font-semibold text-sale hover:underline"
            >
              {showLessLabel} <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
