"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";

interface Template {
  key: string;
  title: string;
  desc: string;
  voice: string;
  language: string;
  maxDuration: number;
  isBlank: boolean;
}

interface Category {
  category: string;
  templates: Template[];
}

export function TemplateBrowser({ categories }: { categories: Category[] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categoryNames = ["All", ...categories.map((c) => c.category)];

  const visibleTemplates =
    activeCategory === "All"
      ? categories.flatMap((c) => c.templates)
      : categories.find((c) => c.category === activeCategory)?.templates ?? [];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categoryNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveCategory(name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === name
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {visibleTemplates.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/campaigns/new?template=${t.key}`}
            className={`bg-card border rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-shadow block ${
              t.isBlank ? "border-dashed border-primary/50" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">{t.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
              <span>Voice: {t.voice}</span>
              <span>{t.language}</span>
              <span>{t.maxDuration / 60}m max</span>
            </div>
            <p className="text-[10px] text-primary font-medium">
              Use template &rarr;
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
