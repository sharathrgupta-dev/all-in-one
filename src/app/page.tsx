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
  ChevronRight,
  Sparkles,
  Clock,
  Send,
  CalendarClock,
  KeyRound,
  GitCompareArrows,
  LineChart,
  Paintbrush,
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
    desc: "Encoding, JSON, Text, Dev, and Conversion tools.",
  },
];

const CATEGORY_ICONS: Record<ToolCategory, React.ElementType> = {
  json: Braces,
  encoding: Code2,
  text: Type,
  dev: Wrench,
  image: Sparkles,
  conversion: ArrowRightLeft,
};

const FEATURED_WORKSPACES: {
  href: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  badge?: string;
}[] = [
  {
    href: "/epoch",
    title: "Epoch Converter",
    desc: "Unix timestamps, live clock, code snippets",
    icon: Clock,
  },
  {
    href: "/api-tester",
    title: "API Tester",
    desc: "HTTP requests, headers, auth, response timing",
    icon: Send,
  },
  {
    href: "/cron-editor",
    title: "Cron Editor",
    desc: "Human-readable schedules and next run times",
    icon: CalendarClock,
  },
  {
    href: "/jwt-debugger",
    title: "JWT Debugger",
    desc: "Decode, encode, verify HS256–HS512 signatures",
    icon: KeyRound,
    badge: "Auth",
  },
  {
    href: "/diff-checker",
    title: "Diff Checker",
    desc: "Side-by-side text compare with character highlights",
    icon: GitCompareArrows,
  },
  {
    href: "/code-beautify",
    title: "Code Beautify",
    desc: "Formatters, validators, encoders — searchable hub like CodeBeautify",
    icon: Paintbrush,
    badge: "Hub",
  },
  {
    href: "/graph-calculator",
    title: "Math Suite",
    desc: "Graph y=f(x), scientific eval, and N×N matrix algebra",
    icon: LineChart,
    badge: "Math",
  },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(
    "all"
  );

  const filtered = useMemo(() => {
    let tools = TOOLS;
    if (activeCategory !== "all") {
      tools = tools.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q)
      );
    }
    return tools;
  }, [search, activeCategory]);

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
              Developer Toolkit
              <br />
              <span className="text-accent">All-in-One</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Format JSON, encode data, diff text, generate hashes, convert
              units — all in your browser. Fast, private, and free.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools... (e.g. base64, json, color)"
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

        {/* JSON Tools CTA */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <Link
            href="/json"
            className="group flex items-center justify-between p-6 rounded-2xl border border-border bg-card hover:border-accent/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <Braces className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  JSON Toolkit — Format, Validate, Diff, Convert
                </h2>
                <p className="text-sm text-muted-foreground">
                  All-in-one JSON workspace with tree view, error fixing, and
                  conversions to YAML/CSV/TypeScript
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
          </Link>
        </section>

        {/* Featured workspaces — same routes as header */}
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Featured workspaces
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED_WORKSPACES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col p-5 rounded-xl border border-border bg-card hover:border-accent/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold group-hover:text-accent transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{item.desc}</p>
                <span className="text-xs text-accent mt-3 inline-flex items-center gap-1 font-medium">
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Tools Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          {/* Category filters */}
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
              const Icon = CATEGORY_ICONS[cat];
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

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No tools match your search.</p>
              <p className="text-sm mt-1">Try a different keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((tool, i) => (
                <Link
                  key={tool.slug}
                  href={
                    tool.slug === "json-formatter"
                      ? "/json"
                      : `/tools/${tool.slug}`
                  }
                  className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent/40 hover:shadow-md transition-all animate-fade-in"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${CATEGORIES[tool.category].color}`}
                  >
                    {tool.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
