"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Terminal, Copy, Check, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import { LINUX_SECTIONS, flattenCommandsForSearch } from "@/lib/linux-cheatsheet-data";

function matchesQuery(q: string, cmd: string, desc: string, example: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    cmd.toLowerCase().includes(s) ||
    desc.toLowerCase().includes(s) ||
    example.toLowerCase().includes(s)
  );
}

export default function LinuxCheatsheetPage() {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const flat = useMemo(() => flattenCommandsForSearch(), []);

  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    return flat.filter(({ entry }) => matchesQuery(query, entry.cmd, entry.desc, entry.example));
  }, [flat, query]);

  const copyExample = useCallback((text: string, key: string) => {
    void navigator.clipboard.writeText(text.replace(/\n/g, " ").trim());
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <ChevronRight className="inline h-3 w-3 mx-1 opacity-50" />
          <span className="text-foreground">Linux cheat sheet</span>
        </nav>

        <div className="flex items-start gap-4 mb-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Terminal className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Linux &amp; server commands</h1>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
              Search across basics, Docker, Kubernetes, networking, and troubleshooting. Each row includes a short description and a
              realistic example you can copy.
            </p>
          </div>
        </div>

        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search — e.g. kubectl logs, chmod, journalctl, curl…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-12 pr-4 py-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            aria-label="Search commands"
          />
          {query.trim() && (
            <p className="mt-2 text-xs text-muted-foreground">
              {filtered?.length ?? 0} match{(filtered?.length ?? 0) === 1 ? "" : "es"}
              {filtered?.length === 0 ? " — try a shorter term or browse sections below." : ""}
            </p>
          )}
        </div>

        {query.trim() && filtered && filtered.length > 0 ? (
          <div className="space-y-3 mb-12">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Search results</h2>
            <ul className="space-y-3">
              {filtered.map(({ sectionTitle, entry }) => {
                const key = `${sectionTitle}-${entry.cmd}`;
                return (
                  <li
                    key={key}
                    className="rounded-xl border border-border bg-card p-4 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium text-accent">{sectionTitle}</span>
                      <code className="text-sm font-semibold text-foreground">{entry.cmd}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{entry.desc}</p>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono border border-border">
                      {entry.example}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyExample(entry.example, key)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                    >
                      {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === key ? "Copied" : "Copy example"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {query.trim() && filtered?.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-10">No matches — clear search to browse all sections.</p>
        ) : null}

        <div className="space-y-14">
          {LINUX_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-foreground mb-1">{section.title}</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-3xl">{section.intro}</p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="px-4 py-3 font-semibold text-foreground w-[22%]">Command</th>
                      <th className="px-4 py-3 font-semibold text-foreground w-[30%]">What it does</th>
                      <th className="px-4 py-3 font-semibold text-foreground">Example</th>
                      <th className="px-4 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {section.entries.map((entry) => {
                      const key = `${section.id}-${entry.cmd}`;
                      return (
                        <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 align-top">
                            <code className="text-xs sm:text-sm font-mono text-accent">{entry.cmd}</code>
                          </td>
                          <td className="px-4 py-3 align-top text-muted-foreground">{entry.desc}</td>
                          <td className="px-4 py-3 align-top">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/90">{entry.example}</pre>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button
                              type="button"
                              onClick={() => copyExample(entry.example, key)}
                              className="text-accent hover:underline text-xs font-medium inline-flex items-center gap-1"
                            >
                              {copied === key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              Copy
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <nav className="mt-12 flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground w-full mb-1">Jump:</span>
          {LINUX_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-2.5 py-1 rounded-full border border-border bg-card hover:border-accent/40 transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </main>
    </>
  );
}
