"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Braces,
  Code2,
  Type,
  Wrench,
  ArrowRightLeft,
  Sparkles,
  DollarSign,
  Heart,
  Sigma,
  CalendarDays,
} from "lucide-react";
import { CATEGORIES, type Tool, type ToolCategory } from "@/lib/tools-registry";

const CATEGORY_ICONS: Record<ToolCategory, React.ElementType> = {
  json:       Braces,
  encoding:   Code2,
  text:       Type,
  dev:        Wrench,
  image:      Sparkles,
  conversion: ArrowRightLeft,
  finance:    DollarSign,
  health:     Heart,
  math:       Sigma,
  datetime:   CalendarDays,
};

const WORKSPACE_ROUTES: Partial<Record<string, string>> = {
  "json-formatter": "/json",
};

function toolHref(slug: string): string {
  return WORKSPACE_ROUTES[slug] ?? `/tools/${slug}`;
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={toolHref(tool.slug)}
      className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/40 hover:shadow-md transition-all"
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${CATEGORIES[tool.category].color}`}
      >
        {tool.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
          {tool.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}

export default function ToolSearch({ tools }: { tools: Tool[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    let result = tools;
    if (activeCategory !== "all") result = result.filter((t) => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tools, search, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory !== "all" || search.trim()) return null;
    const map = new Map<ToolCategory, Tool[]>();
    for (const tool of filtered) {
      const arr = map.get(tool.category) ?? [];
      arr.push(tool);
      map.set(tool.category, arr);
    }
    return map;
  }, [filtered, activeCategory, search]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 pb-20">
      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search tools… (e.g. base64, json, color)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-base shadow-sm transition-shadow"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({tools.length})
        </button>
        {(Object.keys(CATEGORIES) as ToolCategory[]).map((cat) => {
          const Icon  = CATEGORY_ICONS[cat];
          const count = tools.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {CATEGORIES[cat].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Tool grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No tools match your search.</p>
          <p className="text-sm mt-1">Try a different keyword.</p>
        </div>
      ) : grouped ? (
        <div className="space-y-12">
          {(Object.keys(CATEGORIES) as ToolCategory[])
            .filter((cat) => grouped.has(cat))
            .map((cat) => {
              const tools = grouped.get(cat)!;
              const Icon  = CATEGORY_ICONS[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${CATEGORIES[cat].color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-base font-semibold">{CATEGORIES[cat].label}</h2>
                    <span className="text-xs text-muted-foreground">({tools.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tools.map((tool) => (
                      <ToolCard key={tool.slug} tool={tool} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </section>
  );
}
