"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Timer,
  BookOpen,
  Zap,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── cron parsing engine ──────────────────────────────────────────────

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const SHORT_MONTHS = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const FIELD_META = [
  { name: "minute", min: 0, max: 59, label: "Minute" },
  { name: "hour", min: 0, max: 23, label: "Hour" },
  { name: "day of month", min: 1, max: 31, label: "Day (Month)" },
  { name: "month", min: 1, max: 12, label: "Month" },
  { name: "day of week", min: 0, max: 6, label: "Day (Week)" },
];

interface ParsedField {
  raw: string;
  values: number[];
  description: string;
  error?: string;
}

function replaceNames(field: string, idx: number): string {
  let s = field.toUpperCase();
  if (idx === 3) {
    SHORT_MONTHS.forEach((name, i) => { if (i > 0) s = s.replace(new RegExp(`\\b${name}\\b`, "g"), String(i)); });
  }
  if (idx === 4) {
    SHORT_DAYS.forEach((name, i) => { s = s.replace(new RegExp(`\\b${name}\\b`, "g"), String(i)); });
  }
  return s;
}

function parseField(raw: string, idx: number): ParsedField {
  const meta = FIELD_META[idx];
  const field = replaceNames(raw.trim(), idx);

  if (!field) return { raw, values: [], description: "", error: "Empty field" };

  const values = new Set<number>();

  try {
    const parts = field.split(",");
    for (const part of parts) {
      if (part === "*") {
        for (let i = meta.min; i <= meta.max; i++) values.add(i);
      } else if (part.includes("/")) {
        const [rangePart, stepStr] = part.split("/");
        const step = parseInt(stepStr);
        if (isNaN(step) || step <= 0) return { raw, values: [], description: "", error: `Invalid step: ${stepStr}` };
        let start = meta.min;
        let end = meta.max;
        if (rangePart !== "*") {
          if (rangePart.includes("-")) {
            const [a, b] = rangePart.split("-").map(Number);
            start = a;
            end = b;
          } else {
            start = parseInt(rangePart);
          }
        }
        for (let i = start; i <= end; i += step) values.add(i);
      } else if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        if (isNaN(a) || isNaN(b)) return { raw, values: [], description: "", error: `Invalid range: ${part}` };
        if (a > b) {
          for (let i = a; i <= meta.max; i++) values.add(i);
          for (let i = meta.min; i <= b; i++) values.add(i);
        } else {
          for (let i = a; i <= b; i++) values.add(i);
        }
      } else {
        const n = parseInt(part);
        if (isNaN(n)) return { raw, values: [], description: "", error: `Invalid value: ${part}` };
        if (n < meta.min || n > meta.max) return { raw, values: [], description: "", error: `${n} is out of range (${meta.min}-${meta.max})` };
        values.add(n);
      }
    }
  } catch {
    return { raw, values: [], description: "", error: "Parse error" };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const desc = describeField(raw.trim(), sorted, idx);
  return { raw, values: sorted, description: desc };
}

function describeField(raw: string, values: number[], idx: number): string {
  const meta = FIELD_META[idx];
  const allValues = meta.max - meta.min + 1;

  if (values.length === allValues) return `every ${meta.name}`;
  if (values.length === 1) {
    const v = values[0];
    if (idx === 3) return `in ${MONTH_NAMES[v]}`;
    if (idx === 4) return `on ${DAY_NAMES[v]}`;
    return `at ${meta.name} ${v}`;
  }
  if (values.length <= 5) {
    if (idx === 3) return `in ${values.map((v) => MONTH_NAMES[v]).join(", ")}`;
    if (idx === 4) return `on ${values.map((v) => DAY_NAMES[v]).join(", ")}`;
    return `at ${meta.name} ${values.join(", ")}`;
  }

  if (raw.includes("/")) {
    const step = raw.split("/")[1];
    return `every ${step} ${meta.name}${parseInt(step) !== 1 ? "s" : ""}`;
  }

  return `${values.length} specific ${meta.name}s`;
}

function describeCron(fields: ParsedField[]): string {
  if (fields.some((f) => f.error)) return "";

  const [min, hr, dom, mon, dow] = fields;

  const minVal = min.values;
  const hrVal = hr.values;
  const domVal = dom.values;
  const monVal = mon.values;
  const dowVal = dow.values;

  const isEveryMin = minVal.length === 60;
  const isEveryHr = hrVal.length === 24;
  const isEveryDom = domVal.length === 31;
  const isEveryMon = monVal.length === 12;
  const isEveryDow = dowVal.length === 7;

  let timing = "";

  if (isEveryMin && isEveryHr) {
    timing = "Every minute";
  } else if (isEveryMin) {
    timing = `Every minute past hour ${hrVal.join(", ")}`;
  } else if (minVal.length === 1 && isEveryHr) {
    timing = `At minute ${minVal[0]} of every hour`;
  } else if (minVal.length === 1 && hrVal.length === 1) {
    timing = `At ${String(hrVal[0]).padStart(2, "0")}:${String(minVal[0]).padStart(2, "0")}`;
  } else if (!isEveryMin && !isEveryHr) {
    timing = `At minute ${minVal.join(", ")} past hour ${hrVal.join(", ")}`;
  } else {
    timing = `${min.description}, ${hr.description}`;
  }

  const restrictions: string[] = [];
  if (!isEveryDom) {
    if (domVal.length === 1) restrictions.push(`on day-of-month ${domVal[0]}`);
    else restrictions.push(`on day-of-month ${domVal.join(", ")}`);
  }
  if (!isEveryMon) {
    if (monVal.length === 1) restrictions.push(`in ${MONTH_NAMES[monVal[0]]}`);
    else restrictions.push(`in ${monVal.map((v) => MONTH_NAMES[v]).join(", ")}`);
  }
  if (!isEveryDow) {
    if (dowVal.length === 1) restrictions.push(`on ${DAY_NAMES[dowVal[0]]}`);
    else restrictions.push(`on ${dowVal.map((v) => DAY_NAMES[v]).join(", ")}`);
  }

  return restrictions.length ? `${timing}, ${restrictions.join(", ")}` : timing;
}

function getNextRuns(fields: ParsedField[], count = 10): Date[] {
  if (fields.some((f) => f.error)) return [];

  const [min, hr, dom, mon, dow] = fields;
  const runs: Date[] = [];
  const now = new Date();
  const check = new Date(now);
  check.setSeconds(0, 0);

  for (let attempts = 0; attempts < 525600 && runs.length < count; attempts++) {
    check.setMinutes(check.getMinutes() + 1);
    if (
      min.values.includes(check.getMinutes()) &&
      hr.values.includes(check.getHours()) &&
      dom.values.includes(check.getDate()) &&
      mon.values.includes(check.getMonth() + 1) &&
      dow.values.includes(check.getDay())
    ) {
      runs.push(new Date(check));
    }
  }
  return runs;
}

// ─── preset expressions ───────────────────────────────────────────────

const PRESETS = [
  { expr: "* * * * *", label: "Every minute" },
  { expr: "*/5 * * * *", label: "Every 5 minutes" },
  { expr: "*/15 * * * *", label: "Every 15 minutes" },
  { expr: "0 * * * *", label: "Every hour" },
  { expr: "0 */2 * * *", label: "Every 2 hours" },
  { expr: "0 */6 * * *", label: "Every 6 hours" },
  { expr: "0 */12 * * *", label: "Every 12 hours" },
  { expr: "0 0 * * *", label: "Every day at midnight" },
  { expr: "0 12 * * *", label: "Every day at noon" },
  { expr: "0 0 * * 0", label: "Every Sunday at midnight" },
  { expr: "0 0 * * 1-5", label: "Weekdays at midnight" },
  { expr: "0 0 1 * *", label: "First of every month" },
  { expr: "0 0 1 1 *", label: "Every January 1st" },
  { expr: "30 4 * * *", label: "Every day at 4:30 AM" },
  { expr: "0 9 * * 1", label: "Every Monday at 9 AM" },
  { expr: "*/10 * * * *", label: "Every 10 minutes" },
  { expr: "0 0 15 * *", label: "15th of every month" },
  { expr: "0 8-17 * * 1-5", label: "Hourly during business hours" },
];

// ─── CopyBtn ──────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────

export default function CronEditorPage() {
  const [expression, setExpression] = useState("* * * * *");
  const [activeField, setActiveField] = useState<number | null>(null);

  const parts = expression.trim().split(/\s+/);
  const hasFiveParts = parts.length === 5;

  const fields: ParsedField[] = useMemo(() => {
    if (!hasFiveParts) return FIELD_META.map((_, i) => ({ raw: parts[i] || "", values: [], description: "", error: i < parts.length ? undefined : "Missing field" }));
    return parts.map((p, i) => parseField(p, i));
  }, [expression]);

  const hasError = !hasFiveParts || fields.some((f) => f.error);
  const description = useMemo(() => describeCron(fields), [fields]);
  const nextRuns = useMemo(() => getNextRuns(fields), [fields]);

  const setField = useCallback((idx: number, value: string) => {
    const newParts = [...parts];
    while (newParts.length < 5) newParts.push("*");
    newParts[idx] = value;
    setExpression(newParts.join(" "));
  }, [parts]);

  const fieldColors = [
    { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-500", ring: "ring-violet-500/30" },
    { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", ring: "ring-blue-500/30" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500", ring: "ring-emerald-500/30" },
    { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", ring: "ring-amber-500/30" },
    { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-500", ring: "ring-rose-500/30" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Cron Schedule Editor</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            The quick and simple editor for cron schedule expressions. Edit, visualize, and understand your cron jobs.
          </p>
        </div>

        {/* ── Expression editor ─────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5 animate-slide-up">
          {/* Main input */}
          <div className="relative">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              spellCheck={false}
              className="w-full px-5 py-4 text-center text-2xl sm:text-3xl font-mono font-bold rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/40 tracking-[0.2em] placeholder:text-muted-foreground/30"
              placeholder="* * * * *"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CopyBtn text={expression} />
            </div>
          </div>

          {/* Field labels */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {FIELD_META.map((meta, i) => {
              const fc = fieldColors[i];
              const field = fields[i];
              const hasErr = !!field?.error;
              return (
                <button
                  key={i}
                  onClick={() => setActiveField(activeField === i ? null : i)}
                  className={`rounded-lg border px-2 py-2 transition-all text-xs ${
                    hasErr
                      ? "border-destructive/40 bg-destructive/5"
                      : activeField === i
                        ? `${fc.border} ${fc.bg} ring-2 ${fc.ring}`
                        : `border-border bg-muted/30 hover:${fc.bg}`
                  }`}
                >
                  <div className={`font-mono font-bold text-base ${hasErr ? "text-destructive" : fc.text}`}>
                    {parts[i] || "*"}
                  </div>
                  <div className="text-muted-foreground mt-0.5 font-medium">{meta.label}</div>
                  <div className="text-muted-foreground/60 mt-0.5">{meta.min}-{meta.max}</div>
                </button>
              );
            })}
          </div>

          {/* Description */}
          <div className={`rounded-lg px-4 py-3 text-center text-sm font-medium ${
            hasError
              ? "bg-destructive/10 border border-destructive/20 text-destructive"
              : "bg-accent/5 border border-accent/20 text-foreground"
          }`}>
            {hasError ? (
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {!hasFiveParts
                  ? `Expression must have exactly 5 fields (has ${parts.length})`
                  : fields.find((f) => f.error)?.error
                }
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                <span>&ldquo;{description}&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Active field editor ───────────────────────────────────── */}
        {activeField !== null && (
          <div className={`rounded-xl border ${fieldColors[activeField].border} bg-card p-5 animate-fade-in`}>
            <h3 className={`text-sm font-semibold ${fieldColors[activeField].text} mb-3`}>
              {FIELD_META[activeField].label} ({FIELD_META[activeField].min}-{FIELD_META[activeField].max})
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={parts[activeField] || "*"}
                onChange={(e) => setField(activeField, e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/40"
                spellCheck={false}
              />
              {/* Quick values */}
              <div className="flex flex-wrap gap-1.5">
                <QuickBtn label="Every" value="*" onClick={() => setField(activeField, "*")} />
                <QuickBtn label="Every 5" value="*/5" onClick={() => setField(activeField, "*/5")} />
                <QuickBtn label="Every 10" value="*/10" onClick={() => setField(activeField, "*/10")} />
                <QuickBtn label="Every 15" value="*/15" onClick={() => setField(activeField, "*/15")} />
                <QuickBtn label="Every 30" value="*/30" onClick={() => setField(activeField, "*/30")} />
                {activeField === 0 && <QuickBtn label="0" value="0" onClick={() => setField(activeField, "0")} />}
                {activeField === 0 && <QuickBtn label="30" value="30" onClick={() => setField(activeField, "30")} />}
                {activeField === 1 && <QuickBtn label="9-17" value="9-17" onClick={() => setField(activeField, "9-17")} />}
                {activeField === 1 && <QuickBtn label="0" value="0" onClick={() => setField(activeField, "0")} />}
                {activeField === 1 && <QuickBtn label="12" value="12" onClick={() => setField(activeField, "12")} />}
                {activeField === 4 && <QuickBtn label="Mon-Fri" value="1-5" onClick={() => setField(activeField, "1-5")} />}
                {activeField === 4 && <QuickBtn label="Sat-Sun" value="0,6" onClick={() => setField(activeField, "0,6")} />}
              </div>
              {/* Syntax help */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p><code className="text-accent">*</code> = every &nbsp; <code className="text-accent">*/N</code> = every N &nbsp; <code className="text-accent">A-B</code> = range &nbsp; <code className="text-accent">A,B</code> = list</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Next runs ─────────────────────────────────────────────── */}
        {!hasError && (
          <Section title={`Next ${nextRuns.length} Scheduled Runs`} icon={Calendar}>
            {nextRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming runs found within the next year.</p>
            ) : (
              <div className="space-y-0">
                {nextRuns.map((date, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">{i + 1}.</span>
                    <span className="text-sm font-mono text-foreground">
                      {date.toLocaleString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {relativeTime(date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Preset examples ───────────────────────────────────────── */}
        <Section title="Common Cron Expressions" icon={Sparkles} defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                onClick={() => setExpression(p.expr)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted/60 transition-colors group"
              >
                <code className="text-xs font-mono text-accent font-bold shrink-0 w-28 group-hover:text-foreground transition-colors">
                  {p.expr}
                </code>
                <span className="text-xs text-muted-foreground">{p.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Syntax reference ──────────────────────────────────────── */}
        <Section title="Cron Syntax Reference" icon={BookOpen} defaultOpen={false}>
          <div className="space-y-4 text-sm">
            {/* Format diagram */}
            <div className="rounded-lg bg-muted/50 border border-border p-4 font-mono text-xs text-center">
              <pre className="inline-block text-left">
{`┌──────────── minute (0-59)
│ ┌────────── hour (0-23)
│ │ ┌──────── day of month (1-31)
│ │ │ ┌────── month (1-12 or JAN-DEC)
│ │ │ │ ┌──── day of week (0-6 or SUN-SAT)
│ │ │ │ │
* * * * *`}
              </pre>
            </div>

            {/* Operators */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-foreground">Operators</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-1.5 pr-4 font-semibold text-foreground w-24">Symbol</th>
                      <th className="py-1.5 pr-4 font-semibold text-foreground">Meaning</th>
                      <th className="py-1.5 font-semibold text-foreground">Example</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      { sym: "*", meaning: "Any value (wildcard)", example: "* in minute = every minute" },
                      { sym: ",", meaning: "List of values", example: "1,15 in day = 1st and 15th" },
                      { sym: "-", meaning: "Range of values", example: "1-5 in DOW = Monday to Friday" },
                      { sym: "/", meaning: "Step values", example: "*/15 in minute = every 15 min" },
                    ].map((r) => (
                      <tr key={r.sym} className="border-b border-border/50">
                        <td className="py-1.5 pr-4 font-mono font-bold text-accent">{r.sym}</td>
                        <td className="py-1.5 pr-4">{r.meaning}</td>
                        <td className="py-1.5 font-mono">{r.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Special strings */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-foreground">Allowed Names</h4>
              <p className="text-xs text-muted-foreground">
                <strong>Months:</strong> JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC<br />
                <strong>Days:</strong> SUN, MON, TUE, WED, THU, FRI, SAT (SUN = 0, SAT = 6)
              </p>
            </div>

            {/* Tips */}
            <div className="rounded-lg bg-accent/5 border border-accent/20 p-3">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> Cron runs in the server&apos;s timezone (usually UTC). Most cron implementations do not support seconds — the smallest unit is 1 minute.
              </p>
            </div>
          </div>
        </Section>

        {/* ── Quick tips row ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-8">
          {[
            { icon: Timer, title: "Minute Precision", desc: "Standard cron supports minute-level scheduling. For seconds, use systemd timers." },
            { icon: Zap, title: "No Signup Needed", desc: "Edit and test cron expressions directly in your browser. Nothing is stored." },
            { icon: Clock, title: "Local Time", desc: "Next runs are shown in your local timezone. Servers typically run in UTC." },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-xs font-semibold">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── sub-components ───────────────────────────────────────────────────

function QuickBtn({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-muted text-muted-foreground hover:bg-accent/10 hover:text-accent transition-colors"
    >
      {label}
    </button>
  );
}

function relativeTime(date: Date): string {
  const diff = (date.getTime() - Date.now()) / 1000;
  if (diff < 60) return "in less than a minute";
  if (diff < 3600) return `in ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `in ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "tomorrow";
  if (days < 30) return `in ${days} days`;
  return `in ${Math.floor(days / 30)} months`;
}
