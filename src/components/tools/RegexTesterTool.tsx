"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";

const ALL_FLAGS = ["g", "i", "m", "s", "u"] as const;
type Flag = (typeof ALL_FLAGS)[number];

const DEFAULT_TEST = `The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.
How vexingly quick daft zebras jump!
The five boxing wizards jump quickly.`;

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const MATCH_COLORS = [
  "bg-yellow-200/80 dark:bg-yellow-700/50",
  "bg-green-200/80 dark:bg-green-700/50",
  "bg-blue-200/80 dark:bg-blue-700/50",
  "bg-pink-200/80 dark:bg-pink-700/50",
  "bg-purple-200/80 dark:bg-purple-700/50",
];

export default function RegexTesterTool({ tool }: { tool: Tool }) {
  const [pattern, setPattern] = useState("\\b\\w{4,5}\\b");
  const [flags, setFlags] = useState<Set<Flag>>(new Set(["g", "i"]));
  const [testStr, setTestStr] = useState(DEFAULT_TEST);
  const [replacement, setReplacement] = useState("[$&]");
  const [copied, setCopied] = useState<"subst" | null>(null);

  const toggleFlag = (f: Flag) => {
    setFlags((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  const result = useMemo(() => {
    if (!pattern) {
      return {
        error: null,
        matches: [] as { full: string; groups: (string | undefined)[]; index: number }[],
        highlighted: escHtml(testStr),
        substituted: testStr,
        count: 0,
      };
    }
    try {
      const flagStr = Array.from(flags).join("");
      const execFlags = flagStr.includes("g") ? flagStr : flagStr + "g";
      const re = new RegExp(pattern, execFlags);

      const matches: { full: string; groups: (string | undefined)[]; index: number }[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(testStr)) !== null) {
        matches.push({ full: m[0], groups: Array.from(m).slice(1), index: m.index });
        if (m[0].length === 0) re.lastIndex++;
      }

      // Build highlighted HTML
      let highlighted = "";
      let last = 0;
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        highlighted += escHtml(testStr.slice(last, match.index));
        const color = MATCH_COLORS[i % MATCH_COLORS.length];
        highlighted += `<mark class="${color} rounded px-0.5 cursor-default" title="Match ${i + 1}">${escHtml(match.full)}</mark>`;
        last = match.index + match.full.length;
      }
      highlighted += escHtml(testStr.slice(last));

      const subRe = new RegExp(pattern, execFlags);
      const substituted = testStr.replace(subRe, replacement);

      return { error: null, matches, highlighted, substituted, count: matches.length };
    } catch (e) {
      return {
        error: (e as Error).message,
        matches: [],
        highlighted: escHtml(testStr),
        substituted: testStr,
        count: 0,
      };
    }
  }, [pattern, flags, testStr, replacement]);

  const copySubst = () => {
    navigator.clipboard.writeText(result.substituted).then(() => {
      setCopied("subst");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Pattern bar */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-stretch font-mono text-sm">
            <span className="flex items-center px-3 text-muted-foreground border-r border-border bg-muted/50 select-none">
              /
            </span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="enter regex pattern"
              className="flex-1 px-3 py-3 bg-transparent focus:outline-none"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="flex items-center px-3 text-muted-foreground border-l border-border bg-muted/50 select-none">
              /
            </span>
            <div className="flex items-center gap-1 px-3 border-l border-border bg-muted/30">
              {ALL_FLAGS.map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                    flags.has(f)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={
                    { g: "global", i: "case-insensitive", m: "multiline", s: "dotAll", u: "unicode" }[f]
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {result.error && (
            <div className="px-3 py-2 text-xs text-destructive border-t border-border bg-destructive/5">
              {result.error}
            </div>
          )}
        </div>

        {/* Test string */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Test string</label>
            <span className="text-xs">
              {result.count > 0 ? (
                <span className="text-accent font-semibold">
                  {result.count} match{result.count !== 1 ? "es" : ""}
                </span>
              ) : (
                <span className="text-muted-foreground">No matches</span>
              )}
            </span>
          </div>
          <textarea
            value={testStr}
            onChange={(e) => setTestStr(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 resize-y"
          />
        </div>

        {/* Highlighted output */}
        {result.count > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              Match highlights
            </div>
            <div
              className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: result.highlighted }}
            />
          </div>
        )}

        {/* Match list */}
        {result.matches.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              Match details ({result.count})
            </div>
            <div className="divide-y divide-border max-h-64 overflow-auto">
              {result.matches.map((m, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-start gap-3 px-4 py-2.5 text-xs font-mono"
                >
                  <span className="text-muted-foreground shrink-0 w-8">#{i + 1}</span>
                  <span className="font-semibold text-accent">&ldquo;{m.full}&rdquo;</span>
                  <span className="text-muted-foreground">index {m.index}</span>
                  {m.groups.some((g) => g !== undefined) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {m.groups.map(
                        (g, gi) =>
                          g !== undefined && (
                            <span
                              key={gi}
                              className="px-2 py-0.5 rounded bg-muted border border-border"
                            >
                              Group {gi + 1}:{" "}
                              <span className="text-foreground">&ldquo;{g}&rdquo;</span>
                            </span>
                          )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Substitution */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Replace with{" "}
            <span className="font-normal text-muted-foreground text-xs">
              ($& = full match, $1 $2 … = capture groups)
            </span>
          </label>
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40"
            placeholder="replacement string"
          />
        </div>

        {result.count > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                Substituted result
              </span>
              <button
                onClick={copySubst}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                {copied === "subst" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied === "subst" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="p-4 font-mono text-sm whitespace-pre-wrap">
              {result.substituted}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
