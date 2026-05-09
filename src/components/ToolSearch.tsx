"use client";

import { useState, useMemo, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { Star, Search, Braces, Code2, Type, Wrench, ArrowRightLeft, Sparkles, DollarSign, Heart, Sigma, CalendarDays, Clock, Pin, FileStack } from "lucide-react";
import { CATEGORIES, type Tool, type ToolCategory } from "@/lib/tools-registry";

const CATEGORY_ICONS: Record<ToolCategory, React.ElementType> = {
  json:       Braces,
  encoding:   Code2,
  text:       Type,
  dev:        Wrench,
  image:      Sparkles,
  pdf:        FileStack,
  conversion: ArrowRightLeft,
  finance:    DollarSign,
  health:     Heart,
  math:       Sigma,
  datetime:   CalendarDays,
};

const WORKSPACE_ROUTES: Partial<Record<string, string>> = {
  "json-formatter":  "/json",
  "yaml-to-json":    "/yaml",
  "json-to-yaml":    "/yaml",
  "yaml-formatter":  "/yaml",
};

function toolHref(slug: string): string {
  return WORKSPACE_ROUTES[slug] ?? `/tools/${slug}`;
}

const RECENT_KEY = "devbench:recent";
const FAV_KEY    = "devbench:favourites";

function useLocalList(key: string) {
  const [list, setList] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setList(raw ? JSON.parse(raw) : []);
    } catch {
      setList([]);
    }
  }, [key]);

  const toggle = useCallback(
    (slug: string) => {
      setList((prev) => {
        const current = prev ?? [];
        const next = current.includes(slug)
          ? current.filter((s) => s !== slug)
          : [...current, slug];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key],
  );

  return { list, toggle };
}

// Memoised card — only re-renders when isFavourite or the tool itself changes
const ToolCard = memo(function ToolCard({
  tool,
  isFavourite,
  onToggleFavourite,
}: {
  tool: Tool;
  isFavourite: boolean;
  onToggleFavourite: (slug: string) => void;
}) {
  return (
    <div className="relative group">
      <Link
        href={toolHref(tool.slug)}
        className="flex items-center gap-3 p-4 pr-10 rounded-xl border border-border bg-card hover:border-accent/40 hover:bg-muted/30 transition-colors"
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
      <button
        onClick={() => onToggleFavourite(tool.slug)}
        aria-label={
          isFavourite ? "Remove from shortcuts" : "Save to shortcuts"
        }
        className={`absolute top-2.5 right-2.5 p-1 rounded-md transition-colors ${
          isFavourite
            ? "text-amber-400 opacity-100"
            : "text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-amber-400"
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${isFavourite ? "fill-amber-400" : ""}`} />
      </button>
    </div>
  );
});

function MiniSection({ title, icon: Icon, tools, favouriteSet, onToggleFavourite }: {
  title: string;
  icon: React.ElementType;
  tools: Tool[];
  favouriteSet: Set<string>;
  onToggleFavourite: (slug: string) => void;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            isFavourite={favouriteSet.has(tool.slug)}
            onToggleFavourite={onToggleFavourite}
          />
        ))}
      </div>
    </div>
  );
}

export default function ToolSearch({ tools }: { tools: Tool[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");

  const { list: recent }                          = useLocalList(RECENT_KEY);
  const { list: favourites, toggle: toggleFavourite } = useLocalList(FAV_KEY);

  // O(1) lookup set — avoids .includes() on every card render
  const favouriteSet = useMemo(() => new Set(favourites ?? []), [favourites]);

  const recentTools = useMemo(
    () =>
      (recent ?? [])
        .map((slug) => tools.find((t) => t.slug === slug))
        .filter((t): t is Tool => !!t),
    [recent, tools],
  );

  const pinnedTools = useMemo(
    () =>
      [...favouriteSet]
        .map((slug) => tools.find((t) => t.slug === slug))
        .filter((t): t is Tool => !!t),
    [favouriteSet, tools],
  );

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

  const showPersonalised = activeCategory === "all" && !search.trim() && (pinnedTools.length > 0 || recentTools.length > 0);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 pb-20">
      <header className="mb-10 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Find what you need
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Search by keyword or browse by category below. Every tool opens instantly in your
          browser — no account, no upload queue.
        </p>
      </header>

      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="search"
          placeholder="Try PDF, JSON, loan, hex, timezone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 text-base shadow-sm"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-foreground/70 hover:text-foreground"
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
                  : "bg-muted text-foreground/70 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {CATEGORIES[cat].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Personalised sections — only on unfiltered "All" view */}
      {showPersonalised && (
        <div className="mb-4">
          <MiniSection
            title="Your shortcuts"
            icon={Pin}
            tools={pinnedTools}
            favouriteSet={favouriteSet}
            onToggleFavourite={toggleFavourite}
          />
          <MiniSection
            title="Pick up where you left off"
            icon={Clock}
            tools={recentTools}
            favouriteSet={favouriteSet}
            onToggleFavourite={toggleFavourite}
          />
          <hr className="border-border mb-8" />
        </div>
      )}

      {/* Tool grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium text-foreground">Nothing matched that search</p>
          <p className="mt-2 text-sm">
            Try a shorter word, clear the box to see everything, or switch category above.
          </p>
        </div>
      ) : grouped ? (
        <div className="space-y-12">
          {(Object.keys(CATEGORIES) as ToolCategory[])
            .filter((cat) => grouped.has(cat))
            .map((cat) => {
              const catTools = grouped.get(cat)!;
              const Icon     = CATEGORY_ICONS[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${CATEGORIES[cat].color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-base font-semibold">{CATEGORIES[cat].label}</h2>
                    <span className="text-xs text-muted-foreground">({catTools.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catTools.map((tool) => (
                      <ToolCard
                        key={tool.slug}
                        tool={tool}
                        isFavourite={favouriteSet.has(tool.slug)}
                        onToggleFavourite={toggleFavourite}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              isFavourite={favouriteSet.has(tool.slug)}
              onToggleFavourite={toggleFavourite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
