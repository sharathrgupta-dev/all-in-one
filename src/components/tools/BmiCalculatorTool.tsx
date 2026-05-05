"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

function band(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal range";
  if (bmi < 30) return "Overweight";
  return "Obesity (consult a clinician for guidance)";
}

export default function BmiCalculatorTool({ tool }: { tool: Tool }) {
  const [weightKg, setWeightKg] = useState("70");
  const [heightCm, setHeightCm] = useState("175");

  const result = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0 || w <= 0) {
      return null;
    }
    const bmi = w / (h * h);
    return { bmi, label: band(bmi) };
  }, [weightKg, heightCm]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Weight (kg)</label>
            <input
              type="number"
              min={1}
              step={0.1}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Height (cm)</label>
            <input
              type="number"
              min={50}
              step={0.1}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        {result ? (
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">Body mass index</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">{result.bmi.toFixed(1)}</p>
            <p className="mt-2 text-lg font-medium">{result.label}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              WHO-style categories for adults — informational only, not a diagnosis.
            </p>
          </div>
        ) : (
          <p className="text-sm text-destructive">Enter positive weight and height.</p>
        )}
      </div>
    </main>
  );
}
