"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useMarketPrefix } from "@/lib/market-link";

export function HomeSeoArticle() {
  const [expanded, setExpanded] = useState(false);
  const market = useMarketPrefix();

  return (
    <section
      aria-label="About Faiza Zone Online Shopping"
      className="shop-container my-8 lg:my-12"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card via-card/90 to-muted/20 p-5 shadow-xs transition-all duration-300 sm:p-7">
        {/* Header Badge */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sale/10 px-3 py-1 text-xs font-semibold text-sale">
            <Sparkles className="h-3.5 w-3.5" />
            Online Fashion Guide
          </span>
          <span className="text-xs text-muted-foreground">
            Trusted by 120,000+ shoppers worldwide
          </span>
        </div>

        {/* SEO Main Heading */}
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl">
          Faiza Zone — The Premier Online Fashion &amp; Lifestyle Shopping Destination in Bangladesh
        </h2>

        {/* First Line Summary Preview (Always Visible) */}
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            Looking for authentic, trendsetting clothing with guaranteed fabric quality and affordable pricing?{" "}
            <strong className="text-foreground">Faiza Zone</strong> is Bangladesh&apos;s leading e-commerce platform offering an exquisite fusion of traditional South Asian ethnic fashion and contemporary global streetwear.
            {!expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="ml-2 inline-flex cursor-pointer items-center gap-1 font-semibold text-sale hover:underline"
              >
                Read More <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </p>
        </div>

        {/* Action Button Row */}
        <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sale/40 bg-sale/10 px-4 py-2 text-xs font-bold text-sale transition-all duration-200 hover:bg-sale hover:text-white sm:text-sm"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Read More <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Collapsible Article Content (Rendered in DOM for SEO, toggled via display) */}
        <div
          id="seo-article-content"
          style={{ display: expanded ? "block" : "none" }}
          className="mt-4 space-y-4 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm"
        >
          {/* Section 1 */}
          <div>
            <h3 className="font-semibold text-foreground sm:text-base">
              Curated Ethnic Wear: Elegant Kurtis, Panjabis &amp; Festive Attire
            </h3>
            <p className="mt-1">
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
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="font-semibold text-foreground sm:text-base">
              Modern Everyday Styles: Hoodies, Tees, Denim &amp; Footwear
            </h3>
            <p className="mt-1">
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
            </p>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="font-semibold text-foreground sm:text-base">
              Transparent Shopping, Express Nationwide Delivery &amp; Global Dispatch
            </h3>
            <p className="mt-1">
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
            </p>
          </div>

          {/* Close / Collapse button at bottom of article */}
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex cursor-pointer items-center gap-1 font-semibold text-sale hover:underline"
            >
              Show Less <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
