"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

export default function AgeCalculatorTool({ tool }: { tool: Tool }) {
  const [birth, setBirth] = useState("2000-01-01");

  const { breakdown, nextBirthdayLabel } = useMemo(() => {
    const b = new Date(`${birth}T12:00:00`);
    if (Number.isNaN(b.getTime())) return { breakdown: null as null, nextBirthdayLabel: "" };
    const now = new Date();
    if (b > now) {
      return {
        breakdown: { error: "Birth date is in the future." } as const,
        nextBirthdayLabel: "",
      };
    }

    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();
    let days = now.getDate() - b.getDate();
    if (days < 0) {
      months -= 1;
      const prev = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prev.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const ms = now.getTime() - b.getTime();
    const totalDays = Math.floor(ms / 86400000);

    const thisYearBday = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    const next =
      thisYearBday <= now
        ? new Date(now.getFullYear() + 1, b.getMonth(), b.getDate())
        : thisYearBday;
    const nextBirthdayLabel = next.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return {
      breakdown: { years, months, days, totalDays },
      nextBirthdayLabel,
    };
  }, [birth]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="max-w-xs">
          <label className="mb-2 block text-sm font-medium">Birth date</label>
          <input
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        {!breakdown ? (
          <p className="text-sm text-destructive">Invalid date.</p>
        ) : "error" in breakdown ? (
          <p className="text-sm text-destructive">{breakdown.error}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Age
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {breakdown.years}
                <span className="text-lg font-semibold text-muted-foreground"> y </span>
                {breakdown.months}
                <span className="text-lg font-semibold text-muted-foreground"> m </span>
                {breakdown.days}
                <span className="text-lg font-semibold text-muted-foreground"> d</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total days lived
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {breakdown.totalDays.toLocaleString()}
              </p>
            </div>
            <div className="sm:col-span-2 text-sm text-muted-foreground">
              Next birthday (local):{" "}
              <span className="font-medium text-foreground">{nextBirthdayLabel}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
