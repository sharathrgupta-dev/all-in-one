"use client";

import { useCallback, useEffect, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

const COMMON = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "SEK",
  "NZD",
  "MXN",
  "SGD",
  "HKD",
  "NOK",
  "KRW",
  "TRY",
  "ZAR",
  "BRL",
  "PLN",
];

type RatesPayload = { amount: number; base: string; date: string; rates: Record<string, number> };

export default function CurrencyConverterTool({ tool }: { tool: Tool }) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ converted: number; date: string } | null>(
    null
  );

  const fetchRate = useCallback(async () => {
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt < 0) {
      setError("Enter a valid amount.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const url = `https://api.frankfurter.app/latest?amount=${encodeURIComponent(String(amt))}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API error");
      const data = (await res.json()) as RatesPayload;
      const converted = data.rates[to];
      if (typeof converted !== "number") throw new Error("Missing rate");
      setResult({ converted, date: data.date });
    } catch {
      setError("Could not load rates. Check currencies or try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [amount, from, to]);

  useEffect(() => {
    const t = setTimeout(() => void fetchRate(), 400);
    return () => clearTimeout(t);
  }, [fetchRate]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Amount</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              {COMMON.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              {COMMON.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading ECB-based rates…</p>}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {result && !error && (
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-3xl font-bold tabular-nums">
              {result.converted.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {to}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Rate date: {result.date} · Source:{" "}
              <a
                href="https://www.frankfurter.app/"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Frankfurter API
              </a>{" "}
              (ECB data)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
