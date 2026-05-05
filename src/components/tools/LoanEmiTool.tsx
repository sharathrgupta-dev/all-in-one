"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

export default function LoanEmiTool({ tool }: { tool: Tool }) {
  const [principal, setPrincipal] = useState("500000");
  const [annualPct, setAnnualPct] = useState("8.5");
  const [months, setMonths] = useState("240");

  const out = useMemo(() => {
    const P = parseFloat(principal);
    const annual = parseFloat(annualPct) / 100;
    const n = parseInt(months, 10);
    if (!Number.isFinite(P) || !Number.isFinite(annual) || !Number.isFinite(n)) return null;
    if (P <= 0 || n < 1) return null;
    if (annual === 0) {
      const emi = P / n;
      return { emi, total: P, interest: 0, P, n, annual };
    }
    const r = annual / 12;
    const pow = Math.pow(1 + r, n);
    const emi = (P * r * pow) / (pow - 1);
    const total = emi * n;
    const interest = total - P;
    return { emi, total, interest, P, n, annual };
  }, [principal, annualPct, months]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Loan amount</label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Annual interest (%)</label>
            <input
              type="number"
              step={0.01}
              value={annualPct}
              onChange={(e) => setAnnualPct(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Tenure (months)</label>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {out ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">Monthly EMI</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{out.emi.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">Total payment</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{out.total.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs uppercase text-muted-foreground">Total interest</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{out.interest.toFixed(2)}</p>
            </div>
            <p className="sm:col-span-3 text-xs text-muted-foreground">
              Standard amortizing loan formula (fixed rate). Banks may add fees or different day-count
              rules.
            </p>
          </div>
        ) : (
          <p className="text-sm text-destructive">Enter valid principal, rate, and tenure.</p>
        )}
      </div>
    </main>
  );
}
