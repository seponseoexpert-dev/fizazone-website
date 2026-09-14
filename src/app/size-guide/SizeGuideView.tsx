"use client";

import { useState } from "react";
import { PageShell } from "@/components/shop/PageShell";

type Chart = { head: string[]; rows: string[][] };

const charts: Record<string, Chart> = {
  Men: {
    head: ["Size", "Chest (in)", "Waist (in)", "Length (in)"],
    rows: [
      ["S", "36", "30", "27"],
      ["M", "38", "32", "28"],
      ["L", "40", "34", "29"],
      ["XL", "42", "36", "30"],
      ["XXL", "44", "38", "31"],
    ],
  },
  Women: {
    head: ["Size", "Bust (in)", "Waist (in)", "Hip (in)"],
    rows: [
      ["XS", "32", "25", "35"],
      ["S", "34", "27", "37"],
      ["M", "36", "29", "39"],
      ["L", "38", "31", "41"],
      ["XL", "40", "33", "43"],
    ],
  },
  Juniors: {
    head: ["Age", "Height (in)", "Chest (in)", "Waist (in)"],
    rows: [
      ["3-4y", "40", "22", "21"],
      ["5-6y", "45", "24", "22"],
      ["7-8y", "50", "26", "23"],
      ["9-10y", "55", "28", "24"],
      ["11-12y", "59", "30", "25"],
    ],
  },
};

const tabs = Object.keys(charts);

export function SizeGuideView() {
  const [active, setActive] = useState(tabs[0]!);
  const chart = charts[active]!;

  return (
    <PageShell title="Size Guide" subtitle="Measure over light clothing for the best fit." wide>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
              active === tab
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {chart.head.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row[0]} className="border-t border-border">
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3 ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Chest / Bust", "Measure around the fullest part, keeping the tape level."],
          ["Waist", "Measure around the natural waistline, above the hip bone."],
          ["Length", "Measure from the highest shoulder point down to the hem."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-bold text-foreground">{t}</p>
            <p className="mt-1 text-xs text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
