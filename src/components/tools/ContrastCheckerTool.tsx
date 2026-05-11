"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, X, Sparkles, Copy } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

// ─── colour utilities ─────────────────────────────────────────────────

type RGB = [number, number, number];
type HSL = [number, number, number];

function parseColor(input: string): RGB | null {
  const s = input.trim();
  // #RGB
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
  if (short) {
    return [
      parseInt(short[1] + short[1], 16),
      parseInt(short[2] + short[2], 16),
      parseInt(short[3] + short[3], 16),
    ];
  }
  // #RRGGBB
  const long = /^#?([0-9a-f]{6})$/i.exec(s);
  if (long) {
    const h = long[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  // rgb(r, g, b)
  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  return null;
}

function rgbToHex(rgb: RGB): string {
  return "#" + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb([h, s, l]: HSL): RGB {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function linearize(c: number): number {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(rgb: RGB): number {
  return 0.2126 * linearize(rgb[0]) + 0.7152 * linearize(rgb[1]) + 0.0722 * linearize(rgb[2]);
}

function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Find the closest accessible foreground (by L adjustment in HSL space) that
 * meets the target contrast ratio against the given background, while keeping
 * hue/saturation as close to the original as possible.
 */
function findAccessibleVariant(fg: RGB, bg: RGB, targetRatio: number): RGB | null {
  const [h, s] = rgbToHsl(fg);
  const bgLum = luminance(bg);
  // Try darkening then lightening, whichever reaches the target first.
  const directions = bgLum > 0.5 ? [-1, 1] : [1, -1]; // bg light → darken fg first; bg dark → lighten first
  for (const dir of directions) {
    for (let step = 1; step <= 100; step++) {
      const newL = Math.max(0, Math.min(100, rgbToHsl(fg)[2] + dir * step));
      const candidate = hslToRgb([h, s, newL]);
      if (contrastRatio(candidate, bg) >= targetRatio) return candidate;
    }
  }
  return null;
}

// ─── Component ─────────────────────────────────────────────────────────

interface Suggestion {
  label: string;
  rgb: RGB;
  ratio: number;
}

export default function ContrastCheckerTool({ tool }: { tool: Tool }) {
  const [fgInput, setFgInput] = useState("#525964");
  const [bgInput, setBgInput] = useState("#ffffff");
  const [copied, setCopied] = useState<string | null>(null);

  const fg = useMemo(() => parseColor(fgInput), [fgInput]);
  const bg = useMemo(() => parseColor(bgInput), [bgInput]);

  const ratio = useMemo(() => {
    if (!fg || !bg) return null;
    return contrastRatio(fg, bg);
  }, [fg, bg]);

  const grades = useMemo(() => {
    if (ratio == null) return null;
    return {
      aaNormal: ratio >= 4.5,
      aaaNormal: ratio >= 7,
      aaLarge: ratio >= 3,
      aaaLarge: ratio >= 4.5,
      aaUi: ratio >= 3, // WCAG 2.1: 3:1 for UI components & graphical objects
    };
  }, [ratio]);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!fg || !bg || ratio == null) return [];
    if (ratio >= 7) return []; // already passes everything
    const out: Suggestion[] = [];
    const aaFg = findAccessibleVariant(fg, bg, 4.5);
    const aaaFg = findAccessibleVariant(fg, bg, 7);
    if (aaFg && contrastRatio(aaFg, bg) >= 4.5) {
      out.push({ label: "Tweak foreground for AA", rgb: aaFg, ratio: contrastRatio(aaFg, bg) });
    }
    if (aaaFg && contrastRatio(aaaFg, bg) >= 7) {
      out.push({ label: "Tweak foreground for AAA", rgb: aaaFg, ratio: contrastRatio(aaaFg, bg) });
    }
    // Try swapping toward black or white
    if (luminance(bg) > 0.5) {
      out.push({ label: "Pure black on background", rgb: [0, 0, 0], ratio: contrastRatio([0, 0, 0], bg) });
    } else {
      out.push({ label: "Pure white on background", rgb: [255, 255, 255], ratio: contrastRatio([255, 255, 255], bg) });
    }
    // Dedup
    const seen = new Set<string>();
    return out.filter((s) => {
      const k = rgbToHex(s.rgb);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [fg, bg, ratio]);

  const swap = () => {
    setFgInput(bgInput);
    setBgInput(fgInput);
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const applySuggestion = (rgb: RGB) => {
    setFgInput(rgbToHex(rgb));
  };

  // Safe hex for <input type=color> — must be #rrggbb
  const fgColorInput = fg ? rgbToHex(fg) : "#000000";
  const bgColorInput = bg ? rgbToHex(bg) : "#ffffff";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="space-y-5">
        {/* Inputs */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <ColorField
              label="Foreground"
              text={fgInput}
              onText={setFgInput}
              colorValue={fgColorInput}
              valid={!!fg}
            />
            <div className="flex items-end justify-center pb-1">
              <button
                onClick={swap}
                aria-label="Swap foreground and background"
                title="Swap"
                className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <ColorField
              label="Background"
              text={bgInput}
              onText={setBgInput}
              colorValue={bgColorInput}
              valid={!!bg}
            />
          </div>
        </section>

        {/* Live preview */}
        <section
          className="overflow-hidden rounded-2xl border border-border"
          style={{ background: bg ? rgbToHex(bg) : undefined, color: fg ? rgbToHex(fg) : undefined }}
        >
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Preview</p>
            <h3 className="mt-1 text-2xl font-bold">Large text — 24px bold</h3>
            <p className="mt-1 text-lg">Large text — 18.66px regular</p>
            <p className="mt-4 max-w-prose text-base leading-relaxed">
              Normal body text at 16px. The quick brown fox jumps over the lazy dog. WCAG AA requires
              4.5:1 contrast for text under 18pt (or under 14pt bold).
            </p>
            <p className="mt-2 text-sm">Small text 14px — same paragraph at a smaller size.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                style={{
                  background: fg ? rgbToHex(fg) : undefined,
                  color: bg ? rgbToHex(bg) : undefined,
                }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium"
              >
                Primary button
              </button>
              <button
                className="rounded-lg border px-3 py-1.5 text-sm font-medium"
                style={{ borderColor: fg ? rgbToHex(fg) : undefined }}
              >
                Outline button
              </button>
            </div>
          </div>
        </section>

        {/* Results */}
        {!fg || !bg ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Enter valid colours: <code className="font-mono">#RGB</code>, <code className="font-mono">#RRGGBB</code>, or <code className="font-mono">rgb(r,g,b)</code>.
          </p>
        ) : (
          ratio != null && grades && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Contrast ratio
                  </p>
                  <p className="mt-0.5 text-3xl font-bold tabular-nums">
                    {ratio.toFixed(2)}<span className="text-base font-normal text-muted-foreground">:1</span>
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  21:1 is the maximum possible (black on white)
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Grade label="AA — Normal text" ratio="4.5:1" passed={grades.aaNormal} />
                <Grade label="AA — Large text" ratio="3:1" passed={grades.aaLarge} />
                <Grade label="AA — UI components" ratio="3:1" passed={grades.aaUi} />
                <Grade label="AAA — Normal text" ratio="7:1" passed={grades.aaaNormal} />
                <Grade label="AAA — Large text" ratio="4.5:1" passed={grades.aaaLarge} />
              </div>
            </section>
          )
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Accessible alternatives</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Adjusted foregrounds that pass WCAG against your current background. Hue is preserved where possible.
            </p>
            <ul className="space-y-2">
              {suggestions.map((s) => {
                const hex = rgbToHex(s.rgb);
                return (
                  <li
                    key={hex}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg border border-border"
                      style={{ background: hex }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">
                        <code className="font-mono">{hex}</code> · {s.ratio.toFixed(2)}:1
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => copyHex(hex)}
                        aria-label={`Copy ${hex}`}
                        title="Copy"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {copied === hex ? <Check aria-hidden="true" className="h-4 w-4 text-emerald-500" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => applySuggestion(s.rgb)}
                        className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20"
                      >
                        Apply
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function ColorField({
  label, text, onText, colorValue, valid,
}: {
  label: string;
  text: string;
  onText: (v: string) => void;
  colorValue: string;
  valid: boolean;
}) {
  const id = `color-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          value={colorValue}
          onChange={(e) => onText(e.target.value)}
          aria-label={`${label} colour picker`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-background"
        />
        <input
          id={id}
          value={text}
          onChange={(e) => onText(e.target.value)}
          spellCheck={false}
          className={`flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 ${
            valid ? "border-border" : "border-destructive/50"
          }`}
        />
      </div>
    </div>
  );
}

function Grade({ label, ratio, passed }: { label: string; ratio: string; passed: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
        passed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-rose-500/30 bg-rose-500/5"
      }`}
    >
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Min {ratio}</p>
      </div>
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          passed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {passed ? <Check aria-hidden="true" className="h-4 w-4" /> : <X aria-hidden="true" className="h-4 w-4" />}
        {passed ? "Pass" : "Fail"}
      </span>
    </div>
  );
}
