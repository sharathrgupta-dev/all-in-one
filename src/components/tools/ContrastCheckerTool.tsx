"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lin(c: number): number {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(rgb: [number, number, number]): number {
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

function contrastRatio(l1: number, l2: number): number {
  const a = Math.max(l1, l2);
  const b = Math.min(l1, l2);
  return (a + 0.05) / (b + 0.05);
}

export default function ContrastCheckerTool({ tool }: { tool: Tool }) {
  const [fg, setFg] = useState("#0a0a0a");
  const [bg, setBg] = useState("#ffffff");

  const result = useMemo(() => {
    const f = hexToRgb(fg);
    const b = hexToRgb(bg);
    if (!f || !b) return null;
    const lf = luminance(f);
    const lb = luminance(b);
    const ratio = contrastRatio(lf, lb);
    const aa = ratio >= 4.5;
    const aaa = ratio >= 7;
    const aaLarge = ratio >= 3;
    return { ratio, aa, aaa, aaLarge };
  }, [fg, bg]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Foreground</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={fg.startsWith("#") && fg.length === 7 ? fg : "#000000"}
                onChange={(e) => setFg(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
              />
              <input
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bg.startsWith("#") && bg.length === 7 ? bg : "#ffffff"}
                onChange={(e) => setBg(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
              />
              <input
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border border-border p-8 text-center text-lg font-medium"
          style={{ backgroundColor: bg, color: fg }}
        >
          Sample text — headings & body
        </div>

        {!result ? (
          <p className="text-sm text-destructive">Use #RRGGBB hex colors.</p>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-2xl font-bold tabular-nums">
              Contrast ratio: {result.ratio.toFixed(2)}:1
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                WCAG AA normal text (4.5:1):{" "}
                <strong>{result.aa ? "Pass" : "Fail"}</strong>
              </li>
              <li>
                WCAG AAA normal text (7:1):{" "}
                <strong>{result.aaa ? "Pass" : "Fail"}</strong>
              </li>
              <li>
                WCAG AA large text (3:1):{" "}
                <strong>{result.aaLarge ? "Pass" : "Fail"}</strong>
              </li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
