"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, Copy, Check } from "lucide-react";
import Header from "@/components/Header";

/** Calendar-aware add/subtract: years → months → calendar days (weeks×7 + days), local timezone. */
export function dateCalendarShift(
  start: Date,
  direction: 1 | -1,
  years: number,
  months: number,
  weeks: number,
  days: number,
): Date {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  d.setFullYear(d.getFullYear() + direction * years);
  const origDay = d.getDate();
  d.setMonth(d.getMonth() + direction * months);
  if (d.getDate() < origDay) d.setDate(0);
  d.setDate(d.getDate() + direction * (weeks * 7 + days));
  return d;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatLong(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DateCalculatorPage() {
  const today = formatISO(new Date());
  const [startStr, setStartStr] = useState(today);
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [y, setY] = useState("0");
  const [mo, setMo] = useState("0");
  const [w, setW] = useState("0");
  const [d, setD] = useState("7");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const parts = startStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    const [yy, mm, dd] = parts;
    const start = new Date(yy, mm - 1, dd);
    if (start.getFullYear() !== yy || start.getMonth() !== mm - 1 || start.getDate() !== dd) return null;
    const yi = Math.max(0, parseInt(y, 10) || 0);
    const moi = Math.max(0, parseInt(mo, 10) || 0);
    const wi = Math.max(0, parseInt(w, 10) || 0);
    const di = Math.max(0, parseInt(d, 10) || 0);
    const dir: 1 | -1 = mode === "add" ? 1 : -1;
    return dateCalendarShift(start, dir, yi, moi, wi, di);
  }, [startStr, mode, y, mo, w, d]);

  const summary = result ? `${formatLong(result)} (${formatISO(result)})` : "";

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <ChevronRight className="inline h-3 w-3 mx-1 opacity-50" />
          <span className="text-foreground">Date calculator</span>
        </nav>

        <div className="flex items-start gap-4 mb-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <CalendarClock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Date calculator</h1>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Pick a start date, choose add or subtract, then set years, months, weeks, and days — like a calendar-focused date adder.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2">Start date</label>
            <input
              type="date"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div className="flex rounded-xl border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "add" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setMode("subtract")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                mode === "subtract" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Subtract
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Years" value={y} onChange={setY} />
            <Field label="Months" value={mo} onChange={setMo} />
            <Field label="Weeks" value={w} onChange={setW} />
            <Field label="Days" value={d} onChange={setD} />
          </div>

          {result ? (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Result</p>
              <p className="text-lg font-semibold text-foreground">{formatLong(result)}</p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{formatISO(result)}</p>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(summary);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy result"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-destructive">Enter a valid start date.</p>
          )}
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
