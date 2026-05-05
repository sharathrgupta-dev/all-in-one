"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

export default function CompoundInterestTool({ tool }: { tool: Tool }) {
  const [principal, setPrincipal] = useState("10000");
  const [annualPct, setAnnualPct] = useState("5.5");
  const [years, setYears] = useState("10");
  const [nPerYear, setNPerYear] = useState("12");

  const out = useMemo(() => {
    const P = parseFloat(principal);
    const rAnnual = parseFloat(annualPct) / 100;
    const t = parseFloat(years);
    const n = parseFloat(nPerYear);
    if (!Number.isFinite(P) || !Number.isFinite(rAnnual) || !Number.isFinite(t) || !Number.isFinite(n)) {
      return null;
    }
    if (P < 0 || t < 0 || n < 1) return null;
    const amount = P * Math.pow(1 + rAnnual / n, n * t);
    const interest = amount - P;
    return { amount, interest, P, rAnnual, t, n };
  }, [principal, annualPct, years, nPerYear]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Principal</label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Annual rate (%)</label>
            <input
              type="number"
              step={0.01}
              value={annualPct}
              onChange={(e) => setAnnualPct(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Years</label>
            <input
              type="number"
              step={0.25}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Compounds / year</label>
            <select
              value={nPerYear}
              onChange={(e) => setNPerYear(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="1">1 (annual)</option>
              <option value="2">2</option>
              <option value="4">4 (quarterly)</option>
              <option value="12">12 (monthly)</option>
              <option value="365">365 (daily)</option>
            </select>
          </div>
        </div>

        {out ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-6 font-mono text-sm">
            <p>
              Future value{" "}
              <span className="font-mono">
                A = P(1 + r/n)<sup className="text-xs">nt</sup>
              </span>{" "}
              = <strong className="text-lg text-foreground">{out.amount.toFixed(2)}</strong>
            </p>
            <p>Interest earned: {(out.amount - out.P).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              P={out.P}, r={out.rAnnual}, n={out.n}, t={out.t}
            </p>
          </div>
        ) : (
          <p className="text-sm text-destructive">Enter valid numbers.</p>
        )}
      </div>
    </main>
  );
}
