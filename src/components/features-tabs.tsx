"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  hover?: string;
  category: string;
}

const CATEGORY_ORDER = [
  "All",
  "Campaign Intelligence",
  "AI Agents",
  "Channels",
  "Compliance",
  "Platform",
  "Automation",
];

export function FeaturesTabs({ features }: { features: Feature[] }) {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? features
      : features.filter((f) => f.category === active);

  const counts = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] =
        cat === "All"
          ? features.length
          : features.filter((f) => f.category === cat).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              active === cat
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
            <span
              className={`ml-1.5 text-xs ${
                active === cat ? "text-white/70" : "text-muted-foreground/60"
              }`}
            >
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {filtered.map((f) => (
          <div
            key={f.title}
            className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {f.desc}
            </p>
            {f.hover && (
              <div className="absolute inset-0 bg-card/98 backdrop-blur-sm rounded-2xl p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  How it works
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {f.hover}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
