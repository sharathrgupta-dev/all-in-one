"use client";

import { useMemo, useState } from "react";
import { Copy, Check, AlertTriangle, Search } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";

// ─── Unicode helpers ──────────────────────────────────────────────────────────

function getUtf8Bytes(cp: number): string {
  const bytes = new TextEncoder().encode(String.fromCodePoint(cp));
  return Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

function getHtmlEntity(cp: number): string {
  // Named entities for common ASCII
  const named: Record<number, string> = {
    38: "&amp;", 60: "&lt;", 62: "&gt;", 34: "&quot;", 39: "&#x27;",
    160: "&nbsp;", 169: "&copy;", 174: "&reg;", 8364: "&euro;",
    8482: "&trade;", 8220: "&ldquo;", 8221: "&rdquo;",
  };
  if (named[cp]) return named[cp];
  if (cp < 128) return String.fromCodePoint(cp);
  return `&#x${cp.toString(16).toUpperCase()};`;
}

// Unicode general category names (first letter of JS category approximation)
function getCategory(cp: number): string {
  const ch = String.fromCodePoint(cp);
  if (/\p{Lu}/u.test(ch)) return "Letter, Uppercase";
  if (/\p{Ll}/u.test(ch)) return "Letter, Lowercase";
  if (/\p{Lt}/u.test(ch)) return "Letter, Titlecase";
  if (/\p{Lm}/u.test(ch)) return "Letter, Modifier";
  if (/\p{Lo}/u.test(ch)) return "Letter, Other";
  if (/\p{Mn}/u.test(ch)) return "Mark, Non-Spacing";
  if (/\p{Mc}/u.test(ch)) return "Mark, Spacing";
  if (/\p{Me}/u.test(ch)) return "Mark, Enclosing";
  if (/\p{Nd}/u.test(ch)) return "Number, Decimal";
  if (/\p{Nl}/u.test(ch)) return "Number, Letter";
  if (/\p{No}/u.test(ch)) return "Number, Other";
  if (/\p{Pc}/u.test(ch)) return "Punctuation, Connector";
  if (/\p{Pd}/u.test(ch)) return "Punctuation, Dash";
  if (/\p{Ps}/u.test(ch)) return "Punctuation, Open";
  if (/\p{Pe}/u.test(ch)) return "Punctuation, Close";
  if (/\p{Pi}/u.test(ch)) return "Punctuation, Initial";
  if (/\p{Pf}/u.test(ch)) return "Punctuation, Final";
  if (/\p{Po}/u.test(ch)) return "Punctuation, Other";
  if (/\p{Sm}/u.test(ch)) return "Symbol, Math";
  if (/\p{Sc}/u.test(ch)) return "Symbol, Currency";
  if (/\p{Sk}/u.test(ch)) return "Symbol, Modifier";
  if (/\p{So}/u.test(ch)) return "Symbol, Other";
  if (/\p{Zs}/u.test(ch)) return "Separator, Space";
  if (/\p{Zl}/u.test(ch)) return "Separator, Line";
  if (/\p{Zp}/u.test(ch)) return "Separator, Paragraph";
  if (/\p{Cc}/u.test(ch)) return "Control";
  if (/\p{Cf}/u.test(ch)) return "Format";
  if (/\p{Cs}/u.test(ch)) return "Surrogate";
  if (/\p{Co}/u.test(ch)) return "Private Use";
  return "Unassigned";
}

function getScript(cp: number): string {
  const ch = String.fromCodePoint(cp);
  const scripts: [RegExp, string][] = [
    [/\p{Script=Latin}/u, "Latin"],
    [/\p{Script=Greek}/u, "Greek"],
    [/\p{Script=Cyrillic}/u, "Cyrillic"],
    [/\p{Script=Arabic}/u, "Arabic"],
    [/\p{Script=Hebrew}/u, "Hebrew"],
    [/\p{Script=Devanagari}/u, "Devanagari"],
    [/\p{Script=Han}/u, "Han (CJK)"],
    [/\p{Script=Hiragana}/u, "Hiragana"],
    [/\p{Script=Katakana}/u, "Katakana"],
    [/\p{Script=Hangul}/u, "Hangul"],
    [/\p{Script=Thai}/u, "Thai"],
    [/\p{Script=Bengali}/u, "Bengali"],
    [/\p{Script=Tamil}/u, "Tamil"],
    [/\p{Script=Telugu}/u, "Telugu"],
    [/\p{Script=Kannada}/u, "Kannada"],
    [/\p{Script=Malayalam}/u, "Malayalam"],
    [/\p{Script=Gujarati}/u, "Gujarati"],
    [/\p{Script=Gurmukhi}/u, "Gurmukhi"],
    [/\p{Script=Myanmar}/u, "Myanmar"],
    [/\p{Script=Georgian}/u, "Georgian"],
    [/\p{Script=Armenian}/u, "Armenian"],
    [/\p{Script=Ethiopic}/u, "Ethiopic"],
    [/\p{Script=Tibetan}/u, "Tibetan"],
    [/\p{Script=Mongolian}/u, "Mongolian"],
  ];
  for (const [re, name] of scripts) {
    if (re.test(ch)) return name;
  }
  if (/\p{Emoji}/u.test(ch) && cp > 127) return "Emoji";
  if (cp < 128) return "ASCII";
  return "Common / Other";
}

// Dangerous / invisible characters worth flagging
const SUSPICIOUS: Record<number, string> = {
  0x200B: "Zero Width Space",
  0x200C: "Zero Width Non-Joiner",
  0x200D: "Zero Width Joiner",
  0x200E: "Left-to-Right Mark",
  0x200F: "Right-to-Left Mark",
  0x202A: "Left-to-Right Embedding",
  0x202B: "Right-to-Left Embedding",
  0x202C: "Pop Directional Formatting",
  0x202D: "Left-to-Right Override",
  0x202E: "Right-to-Left Override",
  0x2060: "Word Joiner",
  0x2061: "Function Application",
  0x2062: "Invisible Times",
  0x2063: "Invisible Separator",
  0x2064: "Invisible Plus",
  0xFEFF: "BOM / Zero Width No-Break Space",
  0xFFF9: "Interlinear Annotation Anchor",
  0xFFFA: "Interlinear Annotation Separator",
  0xFFFB: "Interlinear Annotation Terminator",
  0xE0001: "Language Tag",
  0xAD: "Soft Hyphen",
};

// Known Unicode name approximations for common/notable codepoints
// (full ICU data unavailable in browser; cover the most common ones)
const KNOWN_NAMES: Record<number, string> = {
  0x0009: "CHARACTER TABULATION",
  0x000A: "LINE FEED (LF)",
  0x000D: "CARRIAGE RETURN (CR)",
  0x0020: "SPACE",
  0x0021: "EXCLAMATION MARK",
  0x0022: "QUOTATION MARK",
  0x0023: "NUMBER SIGN",
  0x0024: "DOLLAR SIGN",
  0x0025: "PERCENT SIGN",
  0x0026: "AMPERSAND",
  0x0027: "APOSTROPHE",
  0x0028: "LEFT PARENTHESIS",
  0x0029: "RIGHT PARENTHESIS",
  0x002A: "ASTERISK",
  0x002B: "PLUS SIGN",
  0x002C: "COMMA",
  0x002D: "HYPHEN-MINUS",
  0x002E: "FULL STOP",
  0x002F: "SOLIDUS",
  0x0030: "DIGIT ZERO", 0x0031: "DIGIT ONE", 0x0032: "DIGIT TWO",
  0x0033: "DIGIT THREE", 0x0034: "DIGIT FOUR", 0x0035: "DIGIT FIVE",
  0x0036: "DIGIT SIX", 0x0037: "DIGIT SEVEN", 0x0038: "DIGIT EIGHT",
  0x0039: "DIGIT NINE",
  0x003A: "COLON", 0x003B: "SEMICOLON",
  0x003C: "LESS-THAN SIGN", 0x003D: "EQUALS SIGN", 0x003E: "GREATER-THAN SIGN",
  0x003F: "QUESTION MARK", 0x0040: "COMMERCIAL AT",
  0x005B: "LEFT SQUARE BRACKET", 0x005C: "REVERSE SOLIDUS",
  0x005D: "RIGHT SQUARE BRACKET", 0x005E: "CIRCUMFLEX ACCENT",
  0x005F: "LOW LINE", 0x0060: "GRAVE ACCENT",
  0x007B: "LEFT CURLY BRACKET", 0x007C: "VERTICAL LINE",
  0x007D: "RIGHT CURLY BRACKET", 0x007E: "TILDE",
  0x00A0: "NO-BREAK SPACE", 0x00A9: "COPYRIGHT SIGN",
  0x00AE: "REGISTERED SIGN", 0x00B0: "DEGREE SIGN",
  0x00B5: "MICRO SIGN", 0x00D7: "MULTIPLICATION SIGN",
  0x00F7: "DIVISION SIGN",
  0x0394: "GREEK CAPITAL LETTER DELTA",
  0x03A9: "GREEK CAPITAL LETTER OMEGA",
  0x03B1: "GREEK SMALL LETTER ALPHA",
  0x03B2: "GREEK SMALL LETTER BETA",
  0x03C0: "GREEK SMALL LETTER PI",
  0x2013: "EN DASH", 0x2014: "EM DASH",
  0x2018: "LEFT SINGLE QUOTATION MARK", 0x2019: "RIGHT SINGLE QUOTATION MARK",
  0x201C: "LEFT DOUBLE QUOTATION MARK", 0x201D: "RIGHT DOUBLE QUOTATION MARK",
  0x2022: "BULLET",
  0x2026: "HORIZONTAL ELLIPSIS",
  0x20AC: "EURO SIGN",
  0x2122: "TRADE MARK SIGN",
  0x2190: "LEFTWARDS ARROW", 0x2192: "RIGHTWARDS ARROW",
  0x2194: "LEFT RIGHT ARROW",
  0x21D2: "RIGHTWARDS DOUBLE ARROW",
  0x2200: "FOR ALL", 0x2203: "THERE EXISTS",
  0x2205: "EMPTY SET", 0x2207: "NABLA",
  0x2208: "ELEMENT OF", 0x2209: "NOT AN ELEMENT OF",
  0x221A: "SQUARE ROOT", 0x221E: "INFINITY",
  0x2227: "LOGICAL AND", 0x2228: "LOGICAL OR",
  0x2260: "NOT EQUAL TO", 0x2261: "IDENTICAL TO",
  0x2264: "LESS-THAN OR EQUAL TO", 0x2265: "GREATER-THAN OR EQUAL TO",
  0x25A0: "BLACK SQUARE", 0x25CF: "BLACK CIRCLE",
  0x2764: "HEAVY BLACK HEART",
  0xFEFF: "ZERO WIDTH NO-BREAK SPACE (BOM)",
  0x200B: "ZERO WIDTH SPACE",
  0x200C: "ZERO WIDTH NON-JOINER",
  0x200D: "ZERO WIDTH JOINER",
  0x200E: "LEFT-TO-RIGHT MARK",
  0x200F: "RIGHT-TO-LEFT MARK",
  0x202E: "RIGHT-TO-LEFT OVERRIDE",
  // Emoji block samples
  0x1F600: "GRINNING FACE", 0x1F601: "GRINNING FACE WITH SMILING EYES",
  0x1F602: "FACE WITH TEARS OF JOY", 0x1F60D: "SMILING FACE WITH HEART-EYES",
  0x1F44D: "THUMBS UP SIGN", 0x1F44E: "THUMBS DOWN SIGN",
  0x2665: "BLACK HEART SUIT",
};

function getCharName(cp: number): string {
  if (KNOWN_NAMES[cp]) return KNOWN_NAMES[cp];
  // Generate a name for ASCII letters/digits
  if (cp >= 0x41 && cp <= 0x5A) return `LATIN CAPITAL LETTER ${String.fromCodePoint(cp)}`;
  if (cp >= 0x61 && cp <= 0x7A) return `LATIN SMALL LETTER ${String.fromCodePoint(cp).toUpperCase()}`;
  if (cp < 0x20 || (cp >= 0x7F && cp <= 0x9F)) return `CONTROL CHARACTER (U+${cp.toString(16).toUpperCase().padStart(4, "0")})`;
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

interface CharInfo {
  char: string;
  cp: number;
  codepoint: string;
  name: string;
  category: string;
  script: string;
  utf8: string;
  htmlEntity: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
  utf16units: number;
}

function analyzeText(text: string): CharInfo[] {
  const result: CharInfo[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    result.push({
      char,
      cp,
      codepoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      name: getCharName(cp),
      category: getCategory(cp),
      script: getScript(cp),
      utf8: getUtf8Bytes(cp),
      htmlEntity: getHtmlEntity(cp),
      isSuspicious: cp in SUSPICIOUS || cp < 0x09 || (cp > 0x0D && cp < 0x20),
      suspiciousReason: SUSPICIOUS[cp],
      utf16units: char.length,
    });
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      className={`inline-flex items-center gap-1 rounded border border-border bg-muted/60 text-muted-foreground hover:bg-muted transition-colors ${small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}`}
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const DEFAULT_TEXT = `Hello, 世界! 🌍\nZero​Width​Space here.\nSmart “quotes” & em—dash.`;

export default function UnicodeCheckerTool({ tool }: { tool: Tool }) {
  const [input, setInput] = useState(DEFAULT_TEXT);
  const [lookup, setLookup] = useState("");
  const [filter, setFilter] = useState<"all" | "suspicious" | "non-ascii">("all");

  const chars = useMemo(() => analyzeText(input), [input]);

  // Lookup: parse "U+1F600" or just "1F600" or "128512" (decimal)
  const lookupResult = useMemo(() => {
    const raw = lookup.trim().toUpperCase().replace(/^U\+/, "");
    if (!raw) return null;
    const cp = raw.match(/^[0-9A-F]+$/)
      ? parseInt(raw, 16)
      : parseInt(raw, 10);
    if (isNaN(cp) || cp < 0 || cp > 0x10FFFF) return null;
    const char = String.fromCodePoint(cp);
    return {
      char,
      cp,
      codepoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      name: getCharName(cp),
      category: getCategory(cp),
      script: getScript(cp),
      utf8: getUtf8Bytes(cp),
      htmlEntity: getHtmlEntity(cp),
      isSuspicious: cp in SUSPICIOUS,
      suspiciousReason: SUSPICIOUS[cp],
      utf16units: char.length,
    } as CharInfo;
  }, [lookup]);

  const filtered = useMemo(() => {
    if (filter === "suspicious") return chars.filter((c) => c.isSuspicious);
    if (filter === "non-ascii") return chars.filter((c) => c.cp > 127);
    return chars;
  }, [chars, filter]);

  const suspiciousCount = chars.filter((c) => c.isSuspicious).length;
  const nonAsciiCount = chars.filter((c) => c.cp > 127).length;
  const uniqueScripts = [...new Set(chars.map((c) => c.script))].filter(
    (s) => s !== "ASCII" && s !== "Common / Other"
  );
  const totalBytes = chars.reduce((acc, c) => acc + c.utf8.split(" ").length, 0);

  return (
    <div className="flex flex-col gap-6">
      <ToolPageHero tool={tool} />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Characters", value: chars.length },
          { label: "Codepoints", value: [...new Set(chars.map((c) => c.cp))].length },
          { label: "UTF-8 bytes", value: totalBytes },
          { label: "Non-ASCII", value: nonAsciiCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {suspiciousCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">{suspiciousCount} suspicious character{suspiciousCount !== 1 ? "s" : ""} detected</span>
            {" "}— invisible formatting, directional overrides, or zero-width characters that may cause display or security issues.
          </div>
        </div>
      )}

      {uniqueScripts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground mr-1">Scripts detected:</span>
          {uniqueScripts.map((s) => (
            <span key={s} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{s}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Input text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste or type any text…"
            rows={6}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Codepoint lookup */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Codepoint lookup</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="U+1F600 or 128512 (decimal)"
              className="w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {lookupResult && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none">{lookupResult.cp < 0x20 || (lookupResult.cp >= 0x7F && lookupResult.cp <= 0x9F) ? "␣" : lookupResult.char}</span>
                <div>
                  <div className="font-semibold text-base">{lookupResult.codepoint}</div>
                  <div className="text-sm text-muted-foreground">{lookupResult.name}</div>
                </div>
                {lookupResult.isSuspicious && (
                  <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5">
                    Invisible / Format
                  </span>
                )}
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {[
                    ["Category", lookupResult.category],
                    ["Script", lookupResult.script],
                    ["UTF-8 bytes", lookupResult.utf8],
                    ["UTF-16 code units", lookupResult.utf16units],
                    ["HTML entity", lookupResult.htmlEntity],
                  ].map(([k, v]) => (
                    <tr key={String(k)} className="border-b border-border last:border-0">
                      <td className="py-1 pr-3 text-muted-foreground w-1/2">{k}</td>
                      <td className="py-1 font-mono flex items-center gap-2">
                        {String(v)}
                        <CopyBtn text={String(v)} small />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {lookup && !lookupResult && (
            <p className="text-sm text-destructive">Invalid codepoint — enter U+XXXX or a decimal number (0–1114111)</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="text-sm text-muted-foreground mr-1">Show:</span>
        {(["all", "non-ascii", "suspicious"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? `All (${chars.length})` : f === "non-ascii" ? `Non-ASCII (${nonAsciiCount})` : `Suspicious (${suspiciousCount})`}
          </button>
        ))}
      </div>

      {/* Character table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {filter === "suspicious" ? "No suspicious characters found." : filter === "non-ascii" ? "No non-ASCII characters found." : "Type or paste text above."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Glyph</th>
                <th className="px-3 py-2 text-left font-medium">Codepoint</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Category</th>
                <th className="px-3 py-2 text-left font-medium hidden md:table-cell">Script</th>
                <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">UTF-8</th>
                <th className="px-3 py-2 text-left font-medium hidden xl:table-cell">HTML</th>
                <th className="px-3 py-2 text-left font-medium">Copy</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={i}
                  className={`border-t border-border hover:bg-muted/30 transition-colors ${
                    c.isSuspicious ? "bg-amber-50/60 dark:bg-amber-950/10" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    {c.isSuspicious ? (
                      <span title={c.suspiciousReason ?? "Suspicious"} className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" />
                        <code className="text-xs bg-amber-100 dark:bg-amber-900/30 px-1 rounded font-mono">
                          {c.codepoint}
                        </code>
                      </span>
                    ) : c.cp < 0x20 || (c.cp >= 0x7F && c.cp <= 0x9F) ? (
                      <code className="text-xs bg-muted px-1 rounded font-mono text-muted-foreground">CTL</code>
                    ) : (
                      <span className="text-lg leading-none font-mono">{c.char}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-primary">{c.codepoint}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[180px] truncate" title={c.name}>
                    {c.isSuspicious && c.suspiciousReason
                      ? <span className="text-amber-700 dark:text-amber-400 font-medium">{c.suspiciousReason}</span>
                      : c.name}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{c.category}</td>
                  <td className="px-3 py-2 text-xs hidden md:table-cell">
                    <span className="rounded-full bg-primary/8 text-primary px-2 py-0.5 text-[10px]">{c.script}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground hidden lg:table-cell">{c.utf8}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground hidden xl:table-cell">{c.htmlEntity}</td>
                  <td className="px-3 py-2">
                    <CopyBtn text={c.char} small />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
