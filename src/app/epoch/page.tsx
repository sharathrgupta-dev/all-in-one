"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRightLeft,
  Calendar,
  Copy,
  Check,
  Timer,
  Code2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── helpers ───────────────────────────────────────────────────────────

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function fmtDate(d: Date, utc = true) {
  if (utc) {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function fmtISO(d: Date) {
  return d.toISOString();
}

function fmtRFC2822(d: Date) {
  return d.toUTCString();
}

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function weekOfYear(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
  return Math.ceil((days + oneJan.getDay() + 1) / 7);
}

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function secondsToBreakdown(totalSec: number) {
  const abs = Math.abs(totalSec);
  const y = Math.floor(abs / 31557600);
  const mo = Math.floor((abs % 31557600) / 2629743);
  const d = Math.floor((abs % 2629743) / 86400);
  const h = Math.floor((abs % 86400) / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const parts: string[] = [];
  if (y) parts.push(`${y} year${y !== 1 ? "s" : ""}`);
  if (mo) parts.push(`${mo} month${mo !== 1 ? "s" : ""}`);
  if (d) parts.push(`${d} day${d !== 1 ? "s" : ""}`);
  if (h) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
  if (m) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
  if (s || !parts.length) parts.push(`${s} second${s !== 1 ? "s" : ""}`);
  return (totalSec < 0 ? "-" : "") + parts.join(", ");
}

const HUMAN_READABLE_TABLE = [
  { label: "1 minute", seconds: "60" },
  { label: "1 hour", seconds: "3,600" },
  { label: "1 day", seconds: "86,400" },
  { label: "1 week", seconds: "604,800" },
  { label: "1 month (~30.44 days)", seconds: "2,629,743" },
  { label: "1 year (365.25 days)", seconds: "31,557,600" },
];

const CODE_EXAMPLES: { lang: string; get: string; convert: string }[] = [
  { lang: "JavaScript", get: "Math.floor(Date.now() / 1000)", convert: 'new Date(epoch * 1000).toISOString()' },
  { lang: "Python", get: "import time; int(time.time())", convert: "import datetime; datetime.datetime.utcfromtimestamp(epoch)" },
  { lang: "Java", get: "System.currentTimeMillis() / 1000", convert: 'new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date(epoch * 1000L))' },
  { lang: "C#", get: "DateTimeOffset.UtcNow.ToUnixTimeSeconds()", convert: "DateTimeOffset.FromUnixTimeSeconds(epoch).DateTime" },
  { lang: "PHP", get: "time()", convert: "date('Y-m-d H:i:s', $epoch)" },
  { lang: "Ruby", get: "Time.now.to_i", convert: "Time.at(epoch).utc" },
  { lang: "Go", get: "time.Now().Unix()", convert: "time.Unix(epoch, 0).UTC()" },
  { lang: "Rust", get: "SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()", convert: "NaiveDateTime::from_timestamp_opt(epoch, 0)" },
  { lang: "SQL (PostgreSQL)", get: "SELECT EXTRACT(EPOCH FROM NOW())", convert: "SELECT TO_TIMESTAMP(epoch)" },
  { lang: "Bash", get: "date +%s", convert: "date -d @epoch" },
  { lang: "PowerShell", get: "[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()", convert: "[DateTimeOffset]::FromUnixTimeSeconds(epoch).DateTime" },
  { lang: "Swift", get: "Int(Date().timeIntervalSince1970)", convert: "Date(timeIntervalSince1970: TimeInterval(epoch))" },
  { lang: "Kotlin", get: "System.currentTimeMillis() / 1000", convert: 'java.time.Instant.ofEpochSecond(epoch).toString()' },
  { lang: "Dart", get: "DateTime.now().millisecondsSinceEpoch ~/ 1000", convert: "DateTime.fromMillisecondsSinceEpoch(epoch * 1000, isUtc: true)" },
  { lang: "R", get: "as.numeric(Sys.time())", convert: 'as.POSIXct(epoch, origin="1970-01-01", tz="GMT")' },
  { lang: "Perl", get: "time", convert: "scalar gmtime(epoch)" },
];

// ─── CopyBtn ──────────────────────────────────────────────────────────

function CopyBtn({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  id,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  id?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Icon className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────

export default function EpochConverterPage() {
  // Live clock
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  // Timestamp → Date
  const [tsInput, setTsInput] = useState("");
  const [tsTimezone, setTsTimezone] = useState<"utc" | "local">("utc");
  const tsResult = useMemo(() => {
    const raw = tsInput.trim();
    if (!raw) return null;
    const num = Number(raw);
    if (isNaN(num)) {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return { error: "Could not parse input. Enter a Unix timestamp (seconds or milliseconds) or a date string." };
      return { date: d, source: "date string" };
    }
    let ms = num;
    let precision = "seconds";
    if (num > 1e16) { ms = num / 1000; precision = "nanoseconds"; }
    else if (num > 1e13) { ms = num / 1000; precision = "microseconds"; }
    else if (num > 1e12) { ms = num; precision = "milliseconds"; }
    else { ms = num * 1000; precision = "seconds"; }
    const d = new Date(ms);
    if (isNaN(d.getTime())) return { error: "Invalid timestamp." };
    return { date: d, source: precision };
  }, [tsInput]);

  // Date → Timestamp
  const [dtYear, setDtYear] = useState("");
  const [dtMonth, setDtMonth] = useState("");
  const [dtDay, setDtDay] = useState("");
  const [dtHour, setDtHour] = useState("");
  const [dtMin, setDtMin] = useState("");
  const [dtSec, setDtSec] = useState("");
  const [dtTimezone, setDtTimezone] = useState<"utc" | "local">("utc");

  const dateToTs = useMemo(() => {
    const y = parseInt(dtYear) || 0;
    const mo = parseInt(dtMonth) || 1;
    const d = parseInt(dtDay) || 1;
    const h = parseInt(dtHour) || 0;
    const m = parseInt(dtMin) || 0;
    const s = parseInt(dtSec) || 0;
    if (!dtYear) return null;
    let date: Date;
    if (dtTimezone === "utc") {
      date = new Date(Date.UTC(y, mo - 1, d, h, m, s));
    } else {
      date = new Date(y, mo - 1, d, h, m, s);
    }
    if (isNaN(date.getTime())) return null;
    return { ts: Math.floor(date.getTime() / 1000), tsMs: date.getTime(), date };
  }, [dtYear, dtMonth, dtDay, dtHour, dtMin, dtSec, dtTimezone]);

  // Date string → Timestamp
  const [dateStrInput, setDateStrInput] = useState("");
  const dateStrResult = useMemo(() => {
    if (!dateStrInput.trim()) return null;
    const d = new Date(dateStrInput.trim());
    if (isNaN(d.getTime())) return { error: "Could not parse date string. Try RFC 2822, ISO 8601, or M/D/Y format." };
    return { ts: Math.floor(d.getTime() / 1000), tsMs: d.getTime(), date: d };
  }, [dateStrInput]);

  // Start/End of period
  const [periodType, setPeriodType] = useState<"year" | "month" | "day">("year");
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));
  const [periodMonth, setPeriodMonth] = useState(String(new Date().getMonth() + 1));
  const [periodDay, setPeriodDay] = useState(String(new Date().getDate()));
  const [periodTz, setPeriodTz] = useState<"utc" | "local">("utc");

  const periodResult = useMemo(() => {
    const y = parseInt(periodYear) || new Date().getFullYear();
    const mo = parseInt(periodMonth) || 1;
    const d = parseInt(periodDay) || 1;
    let start: Date, end: Date;
    if (periodTz === "utc") {
      if (periodType === "year") {
        start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
      } else if (periodType === "month") {
        start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, mo, 0, 23, 59, 59));
      } else {
        start = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
        end = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59));
      }
    } else {
      if (periodType === "year") {
        start = new Date(y, 0, 1, 0, 0, 0);
        end = new Date(y, 11, 31, 23, 59, 59);
      } else if (periodType === "month") {
        start = new Date(y, mo - 1, 1, 0, 0, 0);
        end = new Date(y, mo, 0, 23, 59, 59);
      } else {
        start = new Date(y, mo - 1, d, 0, 0, 0);
        end = new Date(y, mo - 1, d, 23, 59, 59);
      }
    }
    return {
      start: { ts: Math.floor(start.getTime() / 1000), date: start },
      end: { ts: Math.floor(end.getTime() / 1000), date: end },
    };
  }, [periodType, periodYear, periodMonth, periodDay, periodTz]);

  // Seconds → breakdown
  const [secInput, setSecInput] = useState("");
  const secResult = useMemo(() => {
    const n = parseFloat(secInput);
    if (!secInput.trim() || isNaN(n)) return null;
    return secondsToBreakdown(n);
  }, [secInput]);

  // Code examples toggle
  const [showCode, setShowCode] = useState(false);

  const inputClass =
    "px-3 py-2 rounded-lg border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/50 transition-shadow";
  const selectClass =
    "px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
  const resultClass =
    "px-4 py-3 rounded-lg bg-muted/50 border border-border font-mono text-sm space-y-1";

  const nowDate = new Date(now * 1000);

  const setNowInTsInput = useCallback(() => setTsInput(String(now)), [now]);
  const setNowInDateFields = useCallback(() => {
    const d = new Date();
    setDtYear(String(d.getFullYear()));
    setDtMonth(String(d.getMonth() + 1));
    setDtDay(String(d.getDate()));
    setDtHour(String(d.getHours()));
    setDtMin(String(d.getMinutes()));
    setDtSec(String(d.getSeconds()));
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
        {/* Page header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Epoch &amp; Unix Timestamp Converter</h1>
              <p className="text-sm text-muted-foreground">Convert timestamps, dates, and durations — all in your browser</p>
            </div>
          </div>
        </div>

        {/* Live clock */}
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center animate-slide-up">
          <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Current Unix Epoch Time</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl sm:text-5xl font-bold font-mono text-accent tabular-nums tracking-tight">
              {now}
            </span>
            <CopyBtn text={String(now)} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {fmtDate(nowDate, true)} &middot; {fmtDate(nowDate, false)}
          </p>
        </div>

        {/* ── Section 1: Timestamp → Date ───────────────────────────── */}
        <Section title="Convert Timestamp to Date" icon={ArrowRightLeft} id="ts-to-date">
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Unix Timestamp</label>
                <input
                  type="text"
                  value={tsInput}
                  onChange={(e) => setTsInput(e.target.value)}
                  placeholder="e.g. 1777904648 or 1777904648000"
                  className={`${inputClass} w-full`}
                />
              </div>
              <select value={tsTimezone} onChange={(e) => setTsTimezone(e.target.value as "utc" | "local")} className={selectClass}>
                <option value="utc">GMT / UTC</option>
                <option value="local">Local time</option>
              </select>
              <button onClick={setNowInTsInput} className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Now
              </button>
            </div>

            <p className="text-xs text-muted-foreground">Supports seconds (10 digits), milliseconds (13), microseconds (16), and nanoseconds (19). Also accepts date strings.</p>

            {tsResult && !("error" in tsResult) && (
              <div className={resultClass}>
                <Row label="Detected" value={tsResult.source} />
                <Row label="Unix (seconds)" value={String(Math.floor(tsResult.date.getTime() / 1000))} copy />
                <Row label="Unix (milliseconds)" value={String(tsResult.date.getTime())} copy />
                <Row label={tsTimezone === "utc" ? "UTC" : "Local"} value={fmtDate(tsResult.date, tsTimezone === "utc")} copy />
                <Row label="ISO 8601" value={fmtISO(tsResult.date)} copy />
                <Row label="RFC 2822" value={fmtRFC2822(tsResult.date)} copy />
                <Row label="Day of year" value={String(dayOfYear(tsResult.date))} />
                <Row label="Week of year" value={String(weekOfYear(tsResult.date))} />
                <Row label="Leap year" value={isLeapYear(tsResult.date.getFullYear()) ? "Yes" : "No"} />
                <Row label="Relative" value={relativeTime(tsResult.date)} />
              </div>
            )}
            {tsResult && "error" in tsResult && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {tsResult.error}
              </div>
            )}
          </div>
        </Section>

        {/* ── Section 2: Date → Timestamp ───────────────────────────── */}
        <Section title="Convert Date to Timestamp" icon={Calendar} id="date-to-ts">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              {[
                { label: "Year", val: dtYear, set: setDtYear, ph: "2026", w: "w-20" },
                { label: "Month", val: dtMonth, set: setDtMonth, ph: "1-12", w: "w-16" },
                { label: "Day", val: dtDay, set: setDtDay, ph: "1-31", w: "w-16" },
                { label: "Hour", val: dtHour, set: setDtHour, ph: "0-23", w: "w-16" },
                { label: "Min", val: dtMin, set: setDtMin, ph: "0-59", w: "w-16" },
                { label: "Sec", val: dtSec, set: setDtSec, ph: "0-59", w: "w-16" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                  <input type="number" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={`${inputClass} ${f.w}`} />
                </div>
              ))}
              <select value={dtTimezone} onChange={(e) => setDtTimezone(e.target.value as "utc" | "local")} className={selectClass}>
                <option value="utc">GMT / UTC</option>
                <option value="local">Local time</option>
              </select>
              <button onClick={setNowInDateFields} className="px-3 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Now
              </button>
            </div>

            {dateToTs && (
              <div className={resultClass}>
                <Row label="Unix (seconds)" value={String(dateToTs.ts)} copy />
                <Row label="Unix (milliseconds)" value={String(dateToTs.tsMs)} copy />
                <Row label="ISO 8601" value={fmtISO(dateToTs.date)} copy />
                <Row label="RFC 2822" value={fmtRFC2822(dateToTs.date)} copy />
              </div>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Or paste a date string</label>
              <p className="text-xs text-muted-foreground mb-2">Accepts RFC 2822, ISO 8601, D-M-Y, M/D/Y, Y-M-D, etc.</p>
              <input
                type="text"
                value={dateStrInput}
                onChange={(e) => setDateStrInput(e.target.value)}
                placeholder='e.g. "May 4, 2026 21:00:00 GMT" or "2026-05-04T21:00:00Z"'
                className={`${inputClass} w-full`}
              />
              {dateStrResult && !("error" in dateStrResult) && (
                <div className={`${resultClass} mt-3`}>
                  <Row label="Unix (seconds)" value={String(dateStrResult.ts)} copy />
                  <Row label="Unix (milliseconds)" value={String(dateStrResult.tsMs)} copy />
                  <Row label="ISO 8601" value={fmtISO(dateStrResult.date)} copy />
                </div>
              )}
              {dateStrResult && "error" in dateStrResult && (
                <div className="mt-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {dateStrResult.error}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── Section 3: Start/End of period ────────────────────────── */}
        <Section title="Start & End of Year / Month / Day" icon={Calendar} id="period">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Period</label>
                <select value={periodType} onChange={(e) => setPeriodType(e.target.value as "year" | "month" | "day")} className={selectClass}>
                  <option value="year">Year</option>
                  <option value="month">Month</option>
                  <option value="day">Day</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Year</label>
                <input type="number" value={periodYear} onChange={(e) => setPeriodYear(e.target.value)} className={`${inputClass} w-20`} />
              </div>
              {(periodType === "month" || periodType === "day") && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Month</label>
                  <input type="number" min={1} max={12} value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} className={`${inputClass} w-16`} />
                </div>
              )}
              {periodType === "day" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Day</label>
                  <input type="number" min={1} max={31} value={periodDay} onChange={(e) => setPeriodDay(e.target.value)} className={`${inputClass} w-16`} />
                </div>
              )}
              <select value={periodTz} onChange={(e) => setPeriodTz(e.target.value as "utc" | "local")} className={selectClass}>
                <option value="utc">GMT / UTC</option>
                <option value="local">Local time</option>
              </select>
            </div>
            <div className={resultClass}>
              <Row label="Start timestamp" value={String(periodResult.start.ts)} copy />
              <Row label="Start date" value={fmtDate(periodResult.start.date, periodTz === "utc")} copy />
              <Row label="End timestamp" value={String(periodResult.end.ts)} copy />
              <Row label="End date" value={fmtDate(periodResult.end.date, periodTz === "utc")} copy />
            </div>
          </div>
        </Section>

        {/* ── Section 4: Seconds → Breakdown ────────────────────────── */}
        <Section title="Seconds to Human-Readable Duration" icon={Timer} id="duration">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Seconds</label>
              <input
                type="text"
                value={secInput}
                onChange={(e) => setSecInput(e.target.value)}
                placeholder="e.g. 86400"
                className={`${inputClass} w-full max-w-xs`}
              />
            </div>
            {secResult && (
              <div className={resultClass}>
                <Row label="Breakdown" value={secResult} copy />
              </div>
            )}
          </div>
        </Section>

        {/* ── Reference table ───────────────────────────────────────── */}
        <Section title="What is the Unix Epoch?" icon={Clock} id="about" defaultOpen={false}>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              The <strong className="text-foreground">Unix epoch</strong> (also called <strong className="text-foreground">Unix time</strong>, <strong className="text-foreground">POSIX time</strong>, or a <strong className="text-foreground">Unix timestamp</strong>) is the number of seconds since <strong className="text-foreground">January 1, 1970, 00:00:00 UTC</strong>, not counting leap seconds (ISO 8601: 1970-01-01T00:00:00Z).
            </p>
            <p>
              Some systems store epoch values as signed 32-bit integers, which can overflow on <strong className="text-foreground">January 19, 2038</strong> (the Year 2038 Problem). This page handles timestamps in seconds (10 digits), milliseconds (13 digits), microseconds (16 digits), and nanoseconds (19 digits).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-xs font-semibold text-foreground">Human-Readable Time</th>
                    <th className="py-2 text-xs font-semibold text-foreground text-right">Seconds</th>
                  </tr>
                </thead>
                <tbody>
                  {HUMAN_READABLE_TABLE.map((row) => (
                    <tr key={row.label} className="border-b border-border/50">
                      <td className="py-2 pr-4">{row.label}</td>
                      <td className="py-2 font-mono text-right">{row.seconds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ── Code examples ─────────────────────────────────────────── */}
        <Section title="Code Examples — Get & Convert Epoch Time" icon={Code2} id="code" defaultOpen={false}>
          <p className="text-xs text-muted-foreground mb-4">
            First line: get current epoch. Second line: convert epoch <code className="text-accent">1800000000</code> to a date.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-xs font-semibold text-foreground w-36">Language</th>
                  <th className="py-2 text-xs font-semibold text-foreground">Get Current Epoch</th>
                  <th className="py-2 text-xs font-semibold text-foreground">Convert Epoch to Date</th>
                </tr>
              </thead>
              <tbody>
                {CODE_EXAMPLES.map((ex) => (
                  <tr key={ex.lang} className="border-b border-border/50 align-top">
                    <td className="py-2.5 pr-4 font-medium text-sm text-foreground whitespace-nowrap">{ex.lang}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-start gap-1.5">
                        <code className="text-xs font-mono text-muted-foreground break-all">{ex.get}</code>
                        <CopyBtn text={ex.get} className="mt-0.5 shrink-0" />
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-start gap-1.5">
                        <code className="text-xs font-mono text-muted-foreground break-all">{ex.convert}</code>
                        <CopyBtn text={ex.convert} className="mt-0.5 shrink-0" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>

      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">What is the Unix epoch?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong>Unix epoch</strong> is a fixed reference point in time —
          00:00:00 UTC on 1 January 1970. A <strong>Unix timestamp</strong> is
          simply the number of seconds (or milliseconds) elapsed since that
          moment. Because it is a single integer with no timezone ambiguity,
          epoch time is the universal standard for storing and comparing
          timestamps in databases, APIs, log files, and JWT tokens.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Seconds vs milliseconds</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Unix timestamps traditionally use seconds (10-digit integer as of
          2025). JavaScript's{" "}
          <code className="font-mono text-xs">Date.now()</code> returns
          milliseconds (13 digits). Many APIs — Stripe, Twilio, AWS — use
          seconds; browser APIs use milliseconds. Always verify the unit before
          passing a timestamp to an external service.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">The Year 2038 problem</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          On 19 January 2038 at 03:14:07 UTC, a signed 32-bit integer storing a
          Unix timestamp will overflow to a large negative number. Systems that
          store timestamps as 32-bit signed integers will misinterpret future
          dates as 1901. Modern 64-bit systems are not affected — a 64-bit
          timestamp will not overflow for approximately 292 billion years.
        </p>
      </section>

      <Footer />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function Row({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="text-muted-foreground shrink-0 w-36 text-xs pt-0.5">{label}:</span>
      <span className="text-foreground break-all flex-1">{value}</span>
      {copy && <CopyBtn text={value} className="shrink-0 mt-0.5" />}
    </div>
  );
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = (date.getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return diff >= 0 ? "just now" : "just now";
  if (abs < 3600) {
    const m = Math.floor(abs / 60);
    return diff > 0 ? `in ${m} minute${m !== 1 ? "s" : ""}` : `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (abs < 86400) {
    const h = Math.floor(abs / 3600);
    return diff > 0 ? `in ${h} hour${h !== 1 ? "s" : ""}` : `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  if (abs < 2629743) {
    const d = Math.floor(abs / 86400);
    return diff > 0 ? `in ${d} day${d !== 1 ? "s" : ""}` : `${d} day${d !== 1 ? "s" : ""} ago`;
  }
  if (abs < 31557600) {
    const mo = Math.floor(abs / 2629743);
    return diff > 0 ? `in ${mo} month${mo !== 1 ? "s" : ""}` : `${mo} month${mo !== 1 ? "s" : ""} ago`;
  }
  const y = Math.floor(abs / 31557600);
  return diff > 0 ? `in ${y} year${y !== 1 ? "s" : ""}` : `${y} year${y !== 1 ? "s" : ""} ago`;
}
