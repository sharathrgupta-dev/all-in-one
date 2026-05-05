"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

export default function GradientGeneratorTool({ tool }: { tool: Tool }) {
  const [angle, setAngle] = useState(135);
  const [c1, setC1] = useState("#6366f1");
  const [c2, setC2] = useState("#ec4899");
  const [copied, setCopied] = useState(false);

  const css = useMemo(
    () => `linear-gradient(${angle}deg, ${c1}, ${c2})`,
    [angle, c1, c2]
  );

  const copy = () => {
    void navigator.clipboard.writeText(`background: ${css};`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-2 block text-sm font-medium">Angle ({angle}°)</label>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Color 1</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={c1.length === 7 ? c1 : "#6366f1"}
                onChange={(e) => setC1(e.target.value)}
                className="h-10 w-full max-w-[4rem] cursor-pointer rounded border border-border"
              />
              <input
                value={c1}
                onChange={(e) => setC1(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-2 py-2 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Color 2</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={c2.length === 7 ? c2 : "#ec4899"}
                onChange={(e) => setC2(e.target.value)}
                className="h-10 w-full max-w-[4rem] cursor-pointer rounded border border-border"
              />
              <input
                value={c2}
                onChange={(e) => setC2(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-2 py-2 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div
          className="h-40 w-full rounded-xl border border-border shadow-inner"
          style={{ background: css }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-muted px-3 py-2 font-mono text-sm">{css}</code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy CSS"}
          </button>
        </div>
      </div>
    </main>
  );
}
