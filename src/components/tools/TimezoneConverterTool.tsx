"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Copy, Check, Link2, ArrowLeftRight } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import {
  trackToolCopy,
  trackToolShareLink,
} from "@/lib/analytics-events";

const TOOL_SLUG = "timezone-converter";

const COMMON_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function getAllZones(): string[] {
  type IntlWithSupported = typeof Intl & { supportedValuesOf?: (kind: string) => string[] };
  const intl = Intl as IntlWithSupported;
  try {
    if (typeof intl.supportedValuesOf === "function") {
      return intl.supportedValuesOf("timeZone");
    }
  } catch {
    /* fall through */
  }
  return COMMON_ZONES;
}

// Convert a local datetime string ("YYYY-MM-DDTHH:mm") interpreted in `fromZone`
// into a UTC Date. Strategy: format the candidate UTC date in `fromZone` and
// adjust until the formatted local string matches the input — handles DST cleanly.
function localToUtc(localString: string, fromZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localString);
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const h = Number(match[4]);
  const mi = Number(match[5]);
  const targetMs = Date.UTC(y, mo - 1, d, h, mi);
  // First approximation: treat the local string as if it were UTC.
  let utcGuess = targetMs;
  // Adjust three times to converge through DST boundaries.
  for (let i = 0; i < 3; i++) {
    const formatted = formatInZone(new Date(utcGuess), fromZone);
    const formattedMs = Date.UTC(
      formatted.year, formatted.month - 1, formatted.day, formatted.hour, formatted.minute,
    );
    const delta = targetMs - formattedMs;
    if (delta === 0) break;
    utcGuess += delta;
  }
  return new Date(utcGuess);
}

function formatInZone(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

function displayInZone(date: Date, zone: string): { date: string; time: string; offset: string } {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const offsetParts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offset = offsetParts.find((p) => p.type === "timeZoneName")?.value ?? "";
  return { date: dateStr, time: timeStr, offset };
}

function toInputValue(date: Date, zone: string): string {
  const p = formatInZone(date, zone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

function detectBrowserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export default function TimezoneConverterTool({ tool }: { tool: Tool }) {
  const browserZone = useMemo(() => detectBrowserZone(), []);
  const allZones = useMemo(() => getAllZones(), []);

  const [sourceZone, setSourceZone] = useState(browserZone);
  const [localInput, setLocalInput] = useState(() => toInputValue(new Date(), browserZone));
  const [targets, setTargets] = useState<string[]>(() => {
    const seeds = ["America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Tokyo"]
      .filter((z) => z !== browserZone);
    return seeds.slice(0, 3);
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [zoneSearch, setZoneSearch] = useState("");

  const utcDate = useMemo(() => localToUtc(localInput, sourceZone), [localInput, sourceZone]);

  const addZone = (zone: string) => {
    if (!zone || targets.includes(zone) || zone === sourceZone) return;
    setTargets((t) => [...t, zone]);
    setZoneSearch("");
  };

  const removeZone = (zone: string) => {
    setTargets((t) => t.filter((z) => z !== zone));
  };

  const swapWith = (zone: string) => {
    setTargets((t) => [sourceZone, ...t.filter((z) => z !== zone)]);
    setSourceZone(zone);
  };

  const copyMoment = (zone: string) => {
    if (!utcDate) return;
    const v = displayInZone(utcDate, zone);
    const text = `${v.date} · ${v.time} (${v.offset}) — ${zone}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(zone);
      setTimeout(() => setCopied(null), 1500);
      trackToolCopy(TOOL_SLUG, "moment");
    });
  };

  const copyShareLink = () => {
    if (!utcDate) return;
    const params = new URLSearchParams({
      t: String(Math.floor(utcDate.getTime() / 1000)),
      from: sourceZone,
      to: targets.join(","),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied("__share");
      setTimeout(() => setCopied(null), 1500);
      trackToolShareLink(TOOL_SLUG);
    });
  };

  // Restore from URL params on mount. State-setters here are correct: this is
  // one-shot synchronisation from an external source (URL) on first render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    const from = params.get("from");
    const to = params.get("to");
    if (t && from) {
      const date = new Date(Number(t) * 1000);
      if (!isNaN(date.getTime())) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSourceZone(from);
        setLocalInput(toInputValue(date, from));
        if (to) setTargets(to.split(",").filter(Boolean));
      }
    }
  }, []);

  const filteredZones = useMemo(() => {
    const q = zoneSearch.trim().toLowerCase();
    if (!q) return [];
    return allZones
      .filter((z) => z.toLowerCase().includes(q))
      .filter((z) => !targets.includes(z) && z !== sourceZone)
      .slice(0, 8);
  }, [zoneSearch, allZones, targets, sourceZone]);

  const setNow = () => {
    setLocalInput(toInputValue(new Date(), sourceZone));
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="space-y-6">
        {/* Source picker */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Source time</h2>
            <button
              onClick={setNow}
              className="text-xs font-medium text-accent hover:underline"
            >
              Use current time
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="src-datetime" className="mb-1 block text-xs font-medium text-muted-foreground">
                Date &amp; time
              </label>
              <input
                id="src-datetime"
                type="datetime-local"
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div>
              <label htmlFor="src-zone" className="mb-1 block text-xs font-medium text-muted-foreground">
                Time zone
              </label>
              <select
                id="src-zone"
                value={sourceZone}
                onChange={(e) => setSourceZone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {!allZones.includes(sourceZone) && (
                  <option value={sourceZone}>{sourceZone}</option>
                )}
                {allZones.map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={copyShareLink}
                disabled={!utcDate}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground disabled:opacity-40 sm:w-auto"
              >
                {copied === "__share" ? (
                  <>
                    <Check aria-hidden="true" className="h-4 w-4" /> Link copied
                  </>
                ) : (
                  <>
                    <Link2 aria-hidden="true" className="h-4 w-4" /> Share link
                  </>
                )}
              </button>
            </div>
          </div>
          {utcDate && (
            <p className="mt-3 text-xs text-muted-foreground">
              UTC: <span className="font-mono">{utcDate.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "Z")}</span>
              {" · "}Unix: <span className="font-mono">{Math.floor(utcDate.getTime() / 1000)}</span>
            </p>
          )}
        </section>

        {/* Target zones */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Converted times</h2>
            <span className="text-xs text-muted-foreground">{targets.length} zone{targets.length === 1 ? "" : "s"}</span>
          </div>

          {targets.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Add a time zone below to convert your source time.
            </p>
          )}

          {targets.map((zone) => {
            if (!utcDate) return null;
            const v = displayInZone(utcDate, zone);
            return (
              <div
                key={zone}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {zone.replace(/_/g, " ")}
                    <span className="ml-2 text-[11px] font-normal text-muted-foreground">{v.offset}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{v.time}</span> · {v.date}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => swapWith(zone)}
                    aria-label={`Swap source to ${zone}`}
                    title="Swap with source"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyMoment(zone)}
                    aria-label={`Copy time in ${zone}`}
                    title="Copy"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {copied === zone ? <Check aria-hidden="true" className="h-4 w-4 text-emerald-500" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => removeZone(zone)}
                    aria-label={`Remove ${zone}`}
                    title="Remove"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Add zone */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Add another time zone</h3>
          <label htmlFor="zone-search" className="sr-only">Search time zones</label>
          <input
            id="zone-search"
            type="text"
            value={zoneSearch}
            onChange={(e) => setZoneSearch(e.target.value)}
            placeholder="Type to search (e.g. Tokyo, London, Mumbai)…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {filteredZones.length > 0 && (
            <ul className="mt-2 max-h-56 divide-y divide-border overflow-auto rounded-lg border border-border">
              {filteredZones.map((z) => (
                <li key={z}>
                  <button
                    onClick={() => addZone(z)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{z.replace(/_/g, " ")}</span>
                    <Plus aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {zoneSearch && filteredZones.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">No matches.</p>
          )}

          {!zoneSearch && (
            <div className="mt-3 flex flex-wrap gap-2">
              {COMMON_ZONES.filter((z) => !targets.includes(z) && z !== sourceZone)
                .slice(0, 8)
                .map((z) => (
                  <button
                    key={z}
                    onClick={() => addZone(z)}
                    className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                  >
                    + {z.split("/").pop()?.replace(/_/g, " ")}
                  </button>
                ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
