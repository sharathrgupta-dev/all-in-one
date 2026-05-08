"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

// ─── shared helpers ────────────────────────────────────────────────────────
const inp =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
const sel =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${accent ? "border-accent/40 bg-accent/5" : "border-border bg-muted/30"}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── Simple Interest ────────────────────────────────────────────────────────
function SimpleInterest() {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("7");
  const [time, setTime] = useState("3");

  const out = useMemo(() => {
    const P = parseFloat(principal);
    const r = parseFloat(rate);
    const t = parseFloat(time);
    if (!isFinite(P) || !isFinite(r) || !isFinite(t) || P < 0 || r < 0 || t < 0) return null;
    const SI = (P * r * t) / 100;
    const total = P + SI;
    return { SI, total, P, r, t };
  }, [principal, rate, time]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Principal (₹ / $)" hint="Initial amount invested or lent">
          <input type="number" min={0} value={principal} onChange={(e) => setPrincipal(e.target.value)} className={inp} />
        </Field>
        <Field label="Annual interest rate (%)" hint="Rate per year">
          <input type="number" min={0} step={0.1} value={rate} onChange={(e) => setRate(e.target.value)} className={inp} />
        </Field>
        <Field label="Time (years)" hint="Duration of the loan / investment">
          <input type="number" min={0} step={0.5} value={time} onChange={(e) => setTime(e.target.value)} className={inp} />
        </Field>
      </div>
      {out ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Simple Interest" value={fmt(out.SI)} accent />
          <StatCard label="Total Amount" value={fmt(out.total)} />
          <StatCard label="Formula" value={`P×r×t / 100`} />
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid positive numbers.</p>
      )}
    </div>
  );
}

// ─── GST / VAT ──────────────────────────────────────────────────────────────
function GstCalculator() {
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("18");
  const [basis, setBasis] = useState<"exclusive" | "inclusive">("exclusive");

  const out = useMemo(() => {
    const A = parseFloat(amount);
    const r = parseFloat(rate);
    if (!isFinite(A) || !isFinite(r) || A < 0 || r < 0) return null;
    if (basis === "exclusive") {
      const tax = (A * r) / 100;
      return { net: A, tax, gross: A + tax, r };
    } else {
      const net = A / (1 + r / 100);
      const tax = A - net;
      return { net, tax, gross: A, r };
    }
  }, [amount, rate, basis]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={basis === "exclusive" ? "Net amount (before tax)" : "Gross amount (incl. tax)"} hint="Enter the monetary value">
          <input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} className={inp} />
        </Field>
        <Field label="GST / VAT rate (%)" hint="Tax rate percentage">
          <input type="number" min={0} max={100} step={0.5} value={rate} onChange={(e) => setRate(e.target.value)} className={inp} />
        </Field>
        <Field label="Calculation basis" hint="How to apply the tax">
          <select value={basis} onChange={(e) => setBasis(e.target.value as "exclusive" | "inclusive")} className={sel}>
            <option value="exclusive">Add tax to net (exclusive)</option>
            <option value="inclusive">Extract tax from gross (inclusive)</option>
          </select>
        </Field>
      </div>
      {out ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Net (before tax)" value={fmt(out.net)} />
          <StatCard label={`GST @ ${out.r}%`} value={fmt(out.tax)} accent />
          <StatCard label="Gross (after tax)" value={fmt(out.gross)} />
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid positive numbers.</p>
      )}
    </div>
  );
}

// ─── Discount Calculator ────────────────────────────────────────────────────
function DiscountCalculator() {
  const [price, setPrice] = useState("2000");
  const [discount, setDiscount] = useState("25");

  const out = useMemo(() => {
    const P = parseFloat(price);
    const d = parseFloat(discount);
    if (!isFinite(P) || !isFinite(d) || P < 0 || d < 0 || d > 100) return null;
    const savings = (P * d) / 100;
    const salePrice = P - savings;
    return { price: P, discount: d, savings, salePrice };
  }, [price, discount]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Original price" hint="The marked / regular price">
          <input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
        </Field>
        <Field label="Discount (%)" hint="Percentage off the original price">
          <input type="number" min={0} max={100} step={0.5} value={discount} onChange={(e) => setDiscount(e.target.value)} className={inp} />
        </Field>
      </div>
      {out ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Sale Price" value={fmt(out.salePrice)} accent />
          <StatCard label="You Save" value={fmt(out.savings)} />
          <StatCard label="Discount" value={`${out.discount}%`} />
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid numbers (discount 0–100).</p>
      )}
    </div>
  );
}

// ─── Tip Calculator ─────────────────────────────────────────────────────────
function TipCalculator() {
  const [bill, setBill] = useState("1500");
  const [tipPct, setTipPct] = useState("15");
  const [split, setSplit] = useState("1");

  const out = useMemo(() => {
    const B = parseFloat(bill);
    const t = parseFloat(tipPct);
    const s = Math.max(1, parseInt(split));
    if (!isFinite(B) || !isFinite(t) || B < 0 || t < 0) return null;
    const tipAmount = (B * t) / 100;
    const total = B + tipAmount;
    return { bill: B, tipPct: t, tipAmount, total, perPerson: total / s, tipPerPerson: tipAmount / s, split: s };
  }, [bill, tipPct, split]);

  const quickTips = [5, 10, 15, 18, 20, 25];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bill amount" hint="Total before tip">
          <input type="number" min={0} step={0.01} value={bill} onChange={(e) => setBill(e.target.value)} className={inp} />
        </Field>
        <Field label="Tip (%)" hint="Click quick amount or enter custom">
          <input type="number" min={0} max={100} step={1} value={tipPct} onChange={(e) => setTipPct(e.target.value)} className={inp} />
        </Field>
        <Field label="Split between" hint="Number of people">
          <input type="number" min={1} step={1} value={split} onChange={(e) => setSplit(e.target.value)} className={inp} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickTips.map((t) => (
          <button
            key={t}
            onClick={() => setTipPct(String(t))}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${tipPct === String(t) ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {t}%
          </button>
        ))}
      </div>
      {out ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tip Amount" value={fmt(out.tipAmount)} />
          <StatCard label="Total Bill" value={fmt(out.total)} accent />
          {out.split > 1 && <StatCard label={`Each (÷${out.split})`} value={fmt(out.perPerson)} />}
          {out.split > 1 && <StatCard label="Tip / person" value={fmt(out.tipPerPerson)} />}
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid positive numbers.</p>
      )}
    </div>
  );
}

// ─── ROI Calculator ─────────────────────────────────────────────────────────
function RoiCalculator() {
  const [cost, setCost] = useState("50000");
  const [mode, setMode] = useState<"gain" | "profit">("gain");
  const [gainVal, setGainVal] = useState("75000");

  const out = useMemo(() => {
    const C = parseFloat(cost);
    const G = parseFloat(gainVal);
    if (!isFinite(C) || !isFinite(G) || C <= 0) return null;
    const finalVal = mode === "gain" ? G : C + G;
    const profit = finalVal - C;
    const roi = (profit / C) * 100;
    return { cost: C, finalVal, profit, roi };
  }, [cost, mode, gainVal]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Initial investment / cost" hint="Amount you put in">
          <input type="number" min={0} step={1} value={cost} onChange={(e) => setCost(e.target.value)} className={inp} />
        </Field>
        <Field label="Input type" hint="What the second value represents">
          <select value={mode} onChange={(e) => setMode(e.target.value as "gain" | "profit")} className={sel}>
            <option value="gain">Final value (what you got back)</option>
            <option value="profit">Net profit (gain minus cost)</option>
          </select>
        </Field>
        <Field label={mode === "gain" ? "Final value" : "Net profit"} hint={mode === "gain" ? "Total returned" : "Profit only"}>
          <input type="number" step={1} value={gainVal} onChange={(e) => setGainVal(e.target.value)} className={inp} />
        </Field>
      </div>
      {out ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Net Profit" value={fmt(out.profit)} />
          <StatCard label="ROI" value={`${fmt(out.roi)}%`} accent />
          <StatCard label="Final Value" value={fmt(out.finalVal)} />
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid numbers (cost must be &gt; 0).</p>
      )}
    </div>
  );
}

// ─── Profit & Loss ──────────────────────────────────────────────────────────
function ProfitLossCalculator() {
  const [revenue, setRevenue] = useState("120000");
  const [cost, setCost] = useState("80000");

  const out = useMemo(() => {
    const R = parseFloat(revenue);
    const C = parseFloat(cost);
    if (!isFinite(R) || !isFinite(C) || C <= 0) return null;
    const profit = R - C;
    const margin = (profit / R) * 100;
    const markup = (profit / C) * 100;
    const isProfitable = profit >= 0;
    return { revenue: R, cost: C, profit, margin, markup, isProfitable };
  }, [revenue, cost]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Total revenue" hint="Income / sales value">
          <input type="number" min={0} step={1} value={revenue} onChange={(e) => setRevenue(e.target.value)} className={inp} />
        </Field>
        <Field label="Total cost" hint="Expenses / cost of goods">
          <input type="number" min={0} step={1} value={cost} onChange={(e) => setCost(e.target.value)} className={inp} />
        </Field>
      </div>
      {out ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={out.isProfitable ? "Net Profit" : "Net Loss"} value={fmt(Math.abs(out.profit))} accent />
          <StatCard label="Profit Margin" value={`${fmt(out.margin)}%`} />
          <StatCard label="Markup on Cost" value={`${fmt(out.markup)}%`} />
          <StatCard label={out.isProfitable ? "Status" : "Status"} value={out.isProfitable ? "Profitable ✓" : "At a Loss ✗"} />
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid numbers (cost must be &gt; 0).</p>
      )}
    </div>
  );
}

function SalaryHikeCalculator() {
  const [basis, setBasis] = useState<"annual" | "monthly">("annual");
  const [oldSalary, setOldSalary] = useState("800000");
  const [newSalary, setNewSalary] = useState("920000");

  const out = useMemo(() => {
    const oldN = parseFloat(oldSalary);
    const newN = parseFloat(newSalary);
    if (!isFinite(oldN) || !isFinite(newN) || oldN <= 0) return null;
    const diff = newN - oldN;
    const pct = (diff / oldN) * 100;
    const div = basis === "annual" ? 12 : 1;
    const oldM = oldN / div;
    const newM = newN / div;
    return {
      diff,
      pct,
      oldM,
      newM,
      monthlyDiff: newM - oldM,
      oldN,
      newN,
      isIncrease: diff >= 0,
    };
  }, [basis, oldSalary, newSalary]);

  const unit = basis === "annual" ? "year" : "month";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium">Salary amounts are:</span>
        <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40">
          <button
            type="button"
            onClick={() => setBasis("annual")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              basis === "annual" ? "bg-card shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            Annual (per year)
          </button>
          <button
            type="button"
            onClick={() => setBasis("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              basis === "monthly" ? "bg-card shadow text-foreground" : "text-muted-foreground"
            }`}
          >
            Monthly (take-home / gross per month)
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Old salary (per ${unit})`} hint="Package before hike">
          <input
            type="number"
            min={0}
            step={100}
            value={oldSalary}
            onChange={(e) => setOldSalary(e.target.value)}
            className={inp}
          />
        </Field>
        <Field label={`New salary (per ${unit})`} hint="After hike / revised offer">
          <input
            type="number"
            min={0}
            step={100}
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
            className={inp}
          />
        </Field>
      </div>

      {out ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={out.isIncrease ? "Hike %" : "Change %"}
              value={`${fmt(out.pct, 2)}%`}
              accent
            />
            <StatCard
              label={out.isIncrease ? "Increase" : "Change"}
              value={`${out.isIncrease ? "+" : ""}${fmt(out.diff)}`}
            />
            <StatCard label={`Per month (${basis === "annual" ? "÷12" : "same"})`} value={`${out.isIncrease ? "+" : ""}${fmt(out.monthlyDiff)}`} />
            <StatCard label="Multiple" value={`${fmt(out.newN / out.oldN, 4)}×`} />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Monthly difference</strong> is computed as (new − old) / 12 when you enter{" "}
            <strong>annual</strong> figures, or (new − old) when you enter <strong>monthly</strong> figures. This does not deduct tax or
            variable pay — use it as a quick sanity check on raise letters.
          </p>
        </div>
      ) : (
        <p className="text-sm text-destructive">Enter valid positive salaries.</p>
      )}
    </div>
  );
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────
export default function FinanceFormTools({ tool }: { tool: Tool }) {
  const body = (() => {
    switch (tool.slug) {
      case "simple-interest":       return <SimpleInterest />;
      case "gst-calculator":        return <GstCalculator />;
      case "discount-calculator":   return <DiscountCalculator />;
      case "tip-calculator":        return <TipCalculator />;
      case "roi-calculator":        return <RoiCalculator />;
      case "profit-loss-calculator":return <ProfitLossCalculator />;
      case "salary-hike-calculator": return <SalaryHikeCalculator />;
      default:                      return null;
    }
  })();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up rounded-2xl border border-border bg-card p-6">
        {body}
      </div>
    </main>
  );
}
