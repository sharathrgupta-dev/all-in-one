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
  Shield,
  Zap,
  Globe,
  Sparkles,
  DollarSign,
  Heart,
  Sigma,
  CalendarDays,
} from "lucide-react";
import { TOOLS, CATEGORIES, type ToolCategory } from "@/lib/tools-registry";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HERO_FEATURES = [
  {
    icon: Shield,
    title: "100% Client-Side",
    desc: "No server uploads. Your data never leaves your browser.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    desc: "Zero friction. No signup, no waiting, no limits.",
  },
  {
    icon: Globe,
    title: `${TOOLS.length}+ Tools`,
    desc: "Developer utilities plus finance, health, math, and date calculators.",
  },
];

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

// Tools that have dedicated workspace pages (not /tools/[slug])
const WORKSPACE_ROUTES: Partial<Record<string, string>> = {
  "json-formatter": "/json",
};

function toolHref(slug: string): string {
  return WORKSPACE_ROUTES[slug] ?? `/tools/${slug}`;
}

export default function HomePage() {
  const [search, setSearch]                   = useState("");
  const [activeCategory, setActiveCategory]   = useState<ToolCategory | "all">("all");

  const filtered = useMemo(() => {
    let tools = TOOLS;
    if (activeCategory !== "all") tools = tools.filter((t) => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q),
      );
    }
    return tools;
  }, [search, activeCategory]);

  // Group by category only when showing all and no search active
  const grouped = useMemo(() => {
    if (activeCategory !== "all" || search.trim()) return null;
    const map = new Map<ToolCategory, typeof TOOLS>();
    for (const tool of filtered) {
      const arr = map.get(tool.category) ?? [];
      arr.push(tool);
      map.set(tool.category, arr);
    }
    return map;
  }, [filtered, activeCategory, search]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-light),transparent_70%)] opacity-60" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-border bg-card text-sm text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{TOOLS.length} free tools — no signup required</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
              Your Developer
              <br />
              <span className="text-accent">Workbench</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Format JSON, encode Base64, test regex, debug JWT, diff text, generate UUIDs — all in
              your browser. Fast, private, and completely free.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools… (e.g. base64, json, color)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-base shadow-sm transition-shadow"
              />
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
              {HERO_FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3 text-left">
                  <div className="mt-0.5 p-2 rounded-lg bg-accent/10">
                    <f.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools section */}
        <section className="max-w-6xl mx-auto px-4 py-12 pb-20">
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({TOOLS.length})
            </button>
            {(Object.keys(CATEGORIES) as ToolCategory[]).map((cat) => {
              const Icon  = CATEGORY_ICONS[cat];
              const count = TOOLS.filter((t) => t.category === cat).length;
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

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No tools match your search.</p>
              <p className="text-sm mt-1">Try a different keyword.</p>
            </div>
          ) : grouped ? (
            /* Grouped by category when showing all */
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
            /* Flat grid for filtered/searched results */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function ToolCard({ tool }: { tool: (typeof TOOLS)[number] }) {
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
