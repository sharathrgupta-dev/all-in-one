"use client";

import { useMemo, useState } from "react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";

function utf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

function estimateEntropy(str: string): number {
  if (!str.length) return 0;
  const freq = new Map<string, number>();
  for (const ch of str) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  return Array.from(freq.values()).reduce((acc, count) => {
    const p = count / str.length;
    return acc - p * Math.log2(p);
  }, 0);
}

function displayChar(ch: string): string {
  if (ch === " ") return "·SPACE";
  if (ch === "\n") return "·NL";
  if (ch === "\t") return "·TAB";
  if (ch === "\r") return "·CR";
  return ch;
}

export default function StringInspectorTool({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");

  const stats = useMemo(() => {
    const s = input;
    const words = s.trim() ? s.trim().split(/\s+/).length : 0;
    const lines = s ? s.split("\n").length : 0;
    const uniqueChars = new Set(s).size;
    const bytes = utf8ByteLength(s);
    const entropy = estimateEntropy(s);
    const hasNonAscii = /[^\x00-\x7F]/.test(s);
    const hasControl = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(s);

    const freqMap = new Map<string, number>();
    for (const ch of s) freqMap.set(ch, (freqMap.get(ch) ?? 0) + 1);
    const freqTable = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24);

    const codepoints = Array.from(s.slice(0, 120));

    return {
      words,
      lines,
      uniqueChars,
      bytes,
      entropy,
      hasNonAscii,
      hasControl,
      freqTable,
      codepoints,
    };
  }, [input]);

  const statCards = [
    { label: "Characters", value: input.length.toLocaleString() },
    { label: "Bytes (UTF-8)", value: stats.bytes.toLocaleString() },
    { label: "Words", value: stats.words.toLocaleString() },
    { label: "Lines", value: stats.lines.toLocaleString() },
    { label: "Unique chars", value: stats.uniqueChars.toLocaleString() },
    { label: "Entropy (bits/char)", value: stats.entropy.toFixed(3) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder="Paste or type any string to inspect…"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 resize-y"
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p className="text-2xl font-bold font-mono tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Flags */}
        {input && (stats.hasNonAscii || stats.hasControl) && (
          <div className="flex flex-wrap gap-2">
            {stats.hasNonAscii && (
              <span className="px-3 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
                Contains non-ASCII / Unicode characters
              </span>
            )}
            {stats.hasControl && (
              <span className="px-3 py-1 rounded-full text-xs bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-400">
                Contains control characters
              </span>
            )}
          </div>
        )}

        {/* Frequency table */}
        {input && stats.freqTable.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              Top {stats.freqTable.length} character frequencies
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {stats.freqTable.map(([ch, count]) => {
                const pct = ((count / input.length) * 100).toFixed(1);
                const barWidth = Math.round((count / stats.freqTable[0][1]) * 100);
                return (
                  <div
                    key={ch}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-xs"
                  >
                    <span className="font-mono font-bold text-foreground w-12 shrink-0 truncate">
                      {displayChar(ch)}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-accent/60 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unicode codepoints */}
        {input && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
              Unicode codepoints{input.length > 120 ? " (first 120 characters)" : ""}
            </div>
            <div className="p-4 flex flex-wrap gap-1.5">
              {stats.codepoints.map((ch, i) => {
                const cp = ch.codePointAt(0)!;
                const hex = cp.toString(16).toUpperCase().padStart(4, "0");
                const display =
                  ch === " " ? "·" : ch === "\n" ? "↵" : ch === "\t" ? "→" : ch;
                return (
                  <span
                    key={i}
                    title={`U+${hex} — decimal ${cp}`}
                    className="inline-flex flex-col items-center px-1.5 py-1 rounded font-mono text-xs bg-background border border-border cursor-help gap-0.5"
                  >
                    <span className="text-foreground">{display}</span>
                    <span className="text-muted-foreground text-[9px]">{hex}</span>
                  </span>
                );
              })}
              {input.length > 120 && (
                <span className="text-xs text-muted-foreground self-center px-1">
                  +{input.length - 120} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
