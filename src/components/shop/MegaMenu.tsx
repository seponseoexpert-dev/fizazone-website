"use client";

import { Link } from "@/components/ui/link";
import menImg from "@/assets/hero-style-men.jpg";
import womenImg from "@/assets/hero-style-women.jpg";
import juniorsImg from "@/assets/hero-style-juniors.jpg";
import { getImageSrc } from "@/lib/utils";
import {
  DEFAULT_MEGA_MENU_ITEMS,
  useMegaMenuConfig,
  type MegaMenuItem,
  type MegaMenuColumn,
  type MegaMenuSubLink,
} from "@/lib/mega-menu-config";

export { useMegaMenuConfig, DEFAULT_MEGA_MENU_ITEMS };
export type { MegaMenuItem, MegaMenuColumn, MegaMenuSubLink };
export type MegaTab = MegaMenuItem;

export const megaTabs: MegaTab[] = DEFAULT_MEGA_MENU_ITEMS;

export function MegaMenuPanel({ tab, onNavigate }: { tab: MegaTab; onNavigate: () => void }) {
  return (
    <div className="shop-container grid grid-cols-[220px_repeat(3,minmax(0,1fr))] gap-10 py-7">
      <img
        src={tab.image}
        alt={`${tab.label} collection`}
        loading="lazy"
        className="h-[320px] w-full rounded-sm object-cover"
      />

      {tab.columns.map((col) => (
        <div key={col.title} className="min-w-0">
          <h3 className="border-b border-border pb-3 text-[15px] font-semibold text-foreground">
            {col.title}
          </h3>
          <ul className="mt-4 space-y-3">
            {col.links.map((link) => (
              <li key={link.label}>
                <Link
                  to="/categories"
                  search={{ category: link.category }}
                  onClick={onNavigate}
                  className="block truncate text-sm text-muted-foreground transition-colors hover:text-sale"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
