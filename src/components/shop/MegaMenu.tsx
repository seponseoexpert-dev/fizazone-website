"use client";

import { Link } from "@/components/ui/link";
import menImg from "@/assets/hero-style-men.jpg";
import womenImg from "@/assets/hero-style-women.jpg";
import juniorsImg from "@/assets/hero-style-juniors.jpg";
import { getImageSrc } from "@/lib/utils";

type Column = { title: string; links: { label: string; category: string }[] };

export type MegaTab = {
  label: string;
  category: string;
  image: string;
  columns: Column[];
};

export const megaTabs: MegaTab[] = [
  {
    label: "Men",
    category: "Men",
    image: getImageSrc(menImg),
    columns: [
      {
        title: "Clothing",
        links: [
          { label: "Hoodies & Sweatshirts", category: "Men" },
          { label: "Jackets & Vests", category: "Men" },
          { label: "Pants & Tights", category: "Pants" },
          { label: "Panjabi", category: "Panjabi" },
          { label: "Tops & T-Shirts", category: "T-shirt" },
        ],
      },
      {
        title: "Shoes",
        links: [
          { label: "Sneakers", category: "Men" },
          { label: "Running", category: "Men" },
          { label: "Sandals & Slides", category: "Men" },
          { label: "Formal", category: "Men" },
        ],
      },
      {
        title: "Accessories",
        links: [
          { label: "Bags & Backpacks", category: "Bags" },
          { label: "Hat & Beanies", category: "Men" },
          { label: "Socks", category: "Men" },
          { label: "Belts", category: "Men" },
        ],
      },
    ],
  },
  {
    label: "Women",
    category: "Women",
    image: getImageSrc(womenImg),
    columns: [
      {
        title: "Clothing",
        links: [
          { label: "Kurti", category: "Kurti" },
          { label: "Tops & T-Shirts", category: "T-shirt" },
          { label: "Pants & Leggings", category: "Pants" },
          { label: "Dresses", category: "Women" },
          { label: "Ethnic Wear", category: "Women" },
        ],
      },
      {
        title: "Shoes",
        links: [
          { label: "Flats", category: "Women" },
          { label: "Heels", category: "Women" },
          { label: "Sandals & Slides", category: "Women" },
          { label: "Sneakers", category: "Women" },
        ],
      },
      {
        title: "Accessories",
        links: [
          { label: "Bags & Totes", category: "Bags" },
          { label: "Scarves", category: "Women" },
          { label: "Jewellery", category: "Women" },
          { label: "Sunglasses", category: "Women" },
        ],
      },
    ],
  },
  {
    label: "Juniors",
    category: "Boys",
    image: getImageSrc(juniorsImg),
    columns: [
      {
        title: "Clothing",
        links: [
          { label: "Boys T-Shirts", category: "Boys" },
          { label: "Girls Dresses", category: "Boys" },
          { label: "Hoodies", category: "Boys" },
          { label: "Pants & Joggers", category: "Pants" },
        ],
      },
      {
        title: "Shoes",
        links: [
          { label: "Sneakers", category: "Boys" },
          { label: "Sandals", category: "Boys" },
          { label: "School Shoes", category: "Boys" },
        ],
      },
      {
        title: "Accessories",
        links: [
          { label: "School Bags", category: "Bags" },
          { label: "Caps", category: "Boys" },
          { label: "Socks", category: "Boys" },
        ],
      },
    ],
  },
];

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
