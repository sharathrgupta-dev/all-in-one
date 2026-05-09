"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileStack } from "lucide-react";
import {
  getPdfHubTools,
  pdfHubFilterForSlug,
  type PdfHubFilter,
} from "@/lib/pdf-hub";
import { CATEGORIES } from "@/lib/tools-registry";

const FILTERS: { id: PdfHubFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "organize", label: "Organize PDF" },
  { id: "optimize", label: "Optimize PDF" },
  { id: "convert", label: "Convert PDF" },
  { id: "review", label: "Review & annotate" },
];

function hubBadgeLabel(cat: NonNullable<
  ReturnType<typeof pdfHubFilterForSlug>
>): string {
  switch (cat) {
    case "organize":
      return "Organize";
    case "optimize":
      return "Optimize";
    case "convert":
      return "Convert";
    case "review":
      return "Review";
    default:
      return cat;
  }
}

export default function PdfToolsHub() {
  const tools = useMemo(() => getPdfHubTools(), []);
  const [filter, setFilter] = useState<PdfHubFilter>("all");

  const visible = useMemo(() => {
    if (filter === "all") return tools;
    return tools.filter((t) => pdfHubFilterForSlug(t.slug) === filter);
  }, [tools, filter]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-light),transparent_65%)] opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
            <FileStack className="h-4 w-4 text-accent" />
            Free · browser-only · no uploads to our servers
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            PDF tools
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Merge, split, compress, convert, watermark, and more — everything runs
            locally in your browser. Your files stay on your device.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Find what you need
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Filter by task or browse all PDF tools below. Everything runs in your
            browser — no account, no upload queue, and your files stay on your
            device.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((tool) => {
            const cat = CATEGORIES[tool.category];
            const hubCat = pdfHubFilterForSlug(tool.slug);
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-accent/40 hover:bg-muted/40"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${cat.color}`}
                  >
                    {tool.icon}
                  </span>
                  {hubCat && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {hubBadgeLabel(hubCat)}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-foreground group-hover:text-accent">
                  {tool.name}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Open tool
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        {visible.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No tools in this category yet.
          </p>
        )}
      </section>
    </>
  );
}
