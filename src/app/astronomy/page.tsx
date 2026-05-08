"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Moon, Sun, ChevronRight, MapPin, LocateFixed } from "lucide-react";
import Header from "@/components/Header";
import { getTimes, getMoonIllumination, getMoonTimes } from "suncalc";

function moonPhaseName(phase: number): string {
  const cycle = ((phase % 1) + 1) % 1;
  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Third Quarter",
    "Waning Crescent",
  ];
  const i = Math.min(7, Math.floor(cycle * 8 + 0.001));
  return names[i];
}

function formatLocal(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatMaybe(d: Date | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "—";
  return formatLocal(d);
}

const PRESETS: { label: string; lat: number; lng: number }[] = [
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "London", lat: 51.5074, lng: -0.1278 },
  { label: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
];

export default function AstronomyPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateStr, setDateStr] = useState(today);
  const [latStr, setLatStr] = useState("12.9716");
  const [lngStr, setLngStr] = useState("77.5946");
  const [geoHint, setGeoHint] = useState<string | null>(null);

  const coords = useMemo(() => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }, [latStr, lngStr]);

  const result = useMemo(() => {
    if (!coords) return null;
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    const day = new Date(y, m - 1, d, 12, 0, 0);
    if (day.getFullYear() !== y || day.getMonth() !== m - 1 || day.getDate() !== d) return null;

    const sun = getTimes(day, coords.lat, coords.lng);
    const moonIll = getMoonIllumination(day);
    const moonT = getMoonTimes(day, coords.lat, coords.lng);

    return { sun, moonIll, moonT, day };
  }, [coords, dateStr]);

  function requestLocation() {
    setGeoHint(null);
    if (!navigator.geolocation) {
      setGeoHint("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatStr(pos.coords.latitude.toFixed(5));
        setLngStr(pos.coords.longitude.toFixed(5));
        setGeoHint("Location applied.");
      },
      () => setGeoHint("Could not read location — enter latitude/longitude manually."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  const illuminationPct = result ? Math.round(result.moonIll.fraction * 1000) / 10 : 0;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <ChevronRight className="inline h-3 w-3 mx-1 opacity-50" />
          <span className="text-foreground">Sun &amp; Moon</span>
        </nav>

        <div className="flex items-start gap-4 mb-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Sun className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sunrise, sunset &amp; Moon</h1>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-xl">
              Pick a date and location to see solar times, twilight, moon illumination, and moonrise/moonset — similar idea to public
              astronomy calculators, with a clear layout and no accounts.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm mb-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-xs text-muted-foreground mb-2">Quick cities</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setLatStr(String(p.lat));
                      setLngStr(String(p.lng));
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-accent/40 bg-muted/30"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <input
                type="text"
                inputMode="decimal"
                value={latStr}
                onChange={(e) => setLatStr(e.target.value)}
                placeholder="-90 … 90"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Longitude</label>
              <input
                type="text"
                inputMode="decimal"
                value={lngStr}
                onChange={(e) => setLngStr(e.target.value)}
                placeholder="-180 … 180"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={requestLocation}
            className="inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/15"
          >
            <LocateFixed className="h-4 w-4" />
            Use my location
          </button>
          {geoHint && <p className="text-xs text-muted-foreground">{geoHint}</p>}
        </div>

        {!coords && <p className="text-sm text-destructive">Enter valid latitude (−90…90) and longitude (−180…180).</p>}

        {result && coords && (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Sun className="h-5 w-5 text-amber-500" />
                Sun
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Sunrise" value={formatMaybe(result.sun.sunrise)} />
                <Row label="Sunset" value={formatMaybe(result.sun.sunset)} />
                <Row label="Solar noon" value={formatMaybe(result.sun.solarNoon)} />
                <Row label="Golden hour (evening)" value={formatMaybe(result.sun.goldenHour)} />
                <Row label="Civil dusk" value={formatMaybe(result.sun.dusk)} />
                <Row label="Nautical dusk" value={formatMaybe(result.sun.nauticalDusk)} />
              </dl>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Moon className="h-5 w-5 text-slate-400" />
                Moon
              </div>
              <dl className="space-y-2 text-sm">
                <Row label="Phase" value={moonPhaseName(result.moonIll.phase)} />
                <Row label="Illuminated" value={`${illuminationPct}%`} />
                <Row
                  label="Moonrise"
                  value={
                    "rise" in result.moonT && result.moonT.rise
                      ? formatMaybe(result.moonT.rise)
                      : result.moonT.alwaysUp
                        ? "Always above horizon"
                        : result.moonT.alwaysDown
                          ? "Always below horizon"
                          : "—"
                  }
                />
                <Row
                  label="Moonset"
                  value={
                    "set" in result.moonT && result.moonT.set
                      ? formatMaybe(result.moonT.set)
                      : result.moonT.alwaysUp
                        ? "—"
                        : result.moonT.alwaysDown
                          ? "—"
                          : "—"
                  }
                />
              </dl>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Phase angle uses the same engine as illumination; names are approximate buckets for planning (not observatory-grade).
              </p>
            </section>
          </div>
        )}

        <p className="mt-10 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          All times use your browser&apos;s local timezone for display. Try{" "}
          <Link href="/date-calculator" className="text-accent hover:underline">
            Date calculator
          </Link>{" "}
          for calendar offsets on the same site.
        </p>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
