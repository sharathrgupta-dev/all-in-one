"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRightLeft,
  Columns2,
  FileText,
  Trash2,
  Upload,
  Copy,
  Check,
  Settings2,
  BarChart3,
  AlignJustify,
  Strikethrough,
  Eye,
  EyeOff,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── Types ──────────────────────────────────────────────────────────────

type ViewMode = "side-by-side" | "unified" | "inline";

interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  trimTrailingWhitespace: boolean;
  showUnchanged: boolean;
  contextLines: number;
}

type LineType = "added" | "removed" | "unchanged";

interface DiffLine {
  type: LineType;
  leftNum: number | null;
  rightNum: number | null;
  leftText: string;
  rightText: string;
}

interface CharDiff {
  text: string;
  type: "same" | "added" | "removed";
}

interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

// ─── LCS diff algorithm ────────────────────────────────────────────────

function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

function backtrackDiff(
  dp: number[][],
  a: string[],
  b: string[]
): DiffLine[] {
  const result: DiffLine[] = [];
  let i = a.length;
  let j = b.length;
  let leftNum = a.length;
  let rightNum = b.length;

  const lines: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      lines.push({
        type: "unchanged",
        leftNum: i,
        rightNum: j,
        leftText: a[i - 1],
        rightText: b[j - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      lines.push({
        type: "added",
        leftNum: null,
        rightNum: j,
        leftText: "",
        rightText: b[j - 1],
      });
      j--;
    } else {
      lines.push({
        type: "removed",
        leftNum: i,
        rightNum: null,
        leftText: a[i - 1],
        rightText: "",
      });
      i--;
    }
  }

  lines.reverse();
  return lines;
}

function computeLineDiff(
  original: string,
  modified: string,
  options: DiffOptions
): DiffLine[] {
  let leftLines = original.split("\n");
  let rightLines = modified.split("\n");

  const processLine = (line: string): string => {
    let processed = line;
    if (options.trimTrailingWhitespace) processed = processed.replace(/\s+$/, "");
    if (options.ignoreCase) processed = processed.toLowerCase();
    if (options.ignoreWhitespace) processed = processed.replace(/\s+/g, "");
    return processed;
  };

  const processedLeft = leftLines.map(processLine);
  const processedRight = rightLines.map(processLine);

  const dp = computeLCS(processedLeft, processedRight);
  const rawDiff = backtrackDiff(dp, processedLeft, processedRight);

  const result: DiffLine[] = [];
  let li = 0;
  let ri = 0;
  for (const line of rawDiff) {
    if (line.type === "unchanged") {
      result.push({
        ...line,
        leftText: leftLines[line.leftNum! - 1],
        rightText: rightLines[line.rightNum! - 1],
      });
    } else if (line.type === "removed") {
      result.push({
        ...line,
        leftText: leftLines[line.leftNum! - 1],
        rightText: "",
      });
    } else {
      result.push({
        ...line,
        leftText: "",
        rightText: rightLines[line.rightNum! - 1],
      });
    }
  }

  return result;
}

function computeCharDiff(oldStr: string, newStr: string): { left: CharDiff[]; right: CharDiff[] } {
  const oldChars = [...oldStr];
  const newChars = [...newStr];
  const m = oldChars.length;
  const n = newChars.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const left: CharDiff[] = [];
  const right: CharDiff[] = [];
  let i = m;
  let j = n;

  const leftParts: CharDiff[] = [];
  const rightParts: CharDiff[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      leftParts.push({ text: oldChars[i - 1], type: "same" });
      rightParts.push({ text: newChars[j - 1], type: "same" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rightParts.push({ text: newChars[j - 1], type: "added" });
      j--;
    } else {
      leftParts.push({ text: oldChars[i - 1], type: "removed" });
      i--;
    }
  }

  leftParts.reverse();
  rightParts.reverse();

  const merge = (parts: CharDiff[]): CharDiff[] => {
    const merged: CharDiff[] = [];
    for (const p of parts) {
      const last = merged[merged.length - 1];
      if (last && last.type === p.type) {
        last.text += p.text;
      } else {
        merged.push({ ...p });
      }
    }
    return merged;
  };

  return { left: merge(leftParts), right: merge(rightParts) };
}

function calcStats(lines: DiffLine[]): DiffStats {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;
  for (const l of lines) {
    if (l.type === "added") additions++;
    else if (l.type === "removed") deletions++;
    else unchanged++;
  }
  return { additions, deletions, unchanged };
}

function filterWithContext(lines: DiffLine[], contextLines: number): DiffLine[] {
  const changed = new Set<number>();
  lines.forEach((l, i) => {
    if (l.type !== "unchanged") changed.add(i);
  });

  const visible = new Set<number>();
  for (const idx of changed) {
    for (let c = Math.max(0, idx - contextLines); c <= Math.min(lines.length - 1, idx + contextLines); c++) {
      visible.add(c);
    }
  }

  return lines.filter((_, i) => visible.has(i));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── CopyBtn ────────────────────────────────────────────────────────────

function CopyBtn({ text, label, className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
        copied
          ? "border-success/40 bg-success/10 text-success"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${className}`}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
}

// ─── CharHighlight renders ─────────────────────────────────────────────

function CharHighlightLeft({ oldText, newText }: { oldText: string; newText: string }) {
  const { left } = useMemo(() => computeCharDiff(oldText, newText), [oldText, newText]);
  return (
    <span>
      {left.map((part, i) =>
        part.type === "removed" ? (
          <span key={i} className="bg-red-500/30 rounded-sm">{part.text}</span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}

function CharHighlightRight({ oldText, newText }: { oldText: string; newText: string }) {
  const { right } = useMemo(() => computeCharDiff(oldText, newText), [oldText, newText]);
  return (
    <span>
      {right.map((part, i) =>
        part.type === "added" ? (
          <span key={i} className="bg-green-500/30 rounded-sm">{part.text}</span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
}

// ─── Pair up adjacent removes/adds for char diff ───────────────────────

function pairChangedLines(lines: DiffLine[]): DiffLine[][] {
  const groups: DiffLine[][] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "unchanged") {
      groups.push([lines[i]]);
      i++;
    } else {
      const block: DiffLine[] = [];
      while (i < lines.length && lines[i].type !== "unchanged") {
        block.push(lines[i]);
        i++;
      }
      groups.push(block);
    }
  }
  return groups;
}

// ─── Main page ──────────────────────────────────────────────────────────

export default function DiffCheckerPage() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [options, setOptions] = useState<DiffOptions>({
    ignoreWhitespace: false,
    ignoreCase: false,
    trimTrailingWhitespace: false,
    showUnchanged: true,
    contextLines: 3,
  });
  const [showOptions, setShowOptions] = useState(false);

  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  const handleFindDiff = useCallback(() => {
    const lines = computeLineDiff(original, modified, options);
    setDiffResult(lines);
  }, [original, modified, options]);

  const handleSwap = useCallback(() => {
    setOriginal(modified);
    setModified(original);
    setDiffResult(null);
  }, [original, modified]);

  const handleClear = useCallback((side: "left" | "right" | "both") => {
    if (side === "left" || side === "both") setOriginal("");
    if (side === "right" || side === "both") setModified("");
    setDiffResult(null);
  }, []);

  const handleFileLoad = useCallback(
    (side: "left" | "right") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (side === "left") setOriginal(text);
        else setModified(text);
        setDiffResult(null);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  const stats = useMemo(() => {
    if (!diffResult) return null;
    return calcStats(diffResult);
  }, [diffResult]);

  const displayLines = useMemo(() => {
    if (!diffResult) return null;
    if (!options.showUnchanged) {
      return filterWithContext(diffResult, options.contextLines);
    }
    return diffResult;
  }, [diffResult, options.showUnchanged, options.contextLines]);

  const leftSize = useMemo(() => new Blob([original]).size, [original]);
  const rightSize = useMemo(() => new Blob([modified]).size, [modified]);

  const diffText = useMemo(() => {
    if (!displayLines) return "";
    return displayLines
      .map((l) => {
        if (l.type === "added") return `+ ${l.rightText}`;
        if (l.type === "removed") return `- ${l.leftText}`;
        return `  ${l.leftText}`;
      })
      .join("\n");
  }, [displayLines]);

  const percentChanged = useMemo(() => {
    if (!stats) return 0;
    const total = stats.additions + stats.deletions + stats.unchanged;
    if (total === 0) return 0;
    return Math.round(((stats.additions + stats.deletions) / total) * 100);
  }, [stats]);

  const groups = useMemo(() => {
    if (!displayLines) return [];
    return pairChangedLines(displayLines);
  }, [displayLines]);

  const toggleOption = (key: keyof DiffOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const viewModes: { key: ViewMode; label: string; icon: React.ElementType }[] = [
    { key: "side-by-side", label: "Side by Side", icon: Columns2 },
    { key: "unified", label: "Unified", icon: AlignJustify },
    { key: "inline", label: "Inline", icon: Strikethrough },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Page header */}
        <div className="animate-fade-in">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mt-3">
            <div className="p-2.5 rounded-xl bg-accent/10">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Diff Checker</h1>
              <p className="text-sm text-muted-foreground">
                Compare text online — find differences between two texts instantly
              </p>
            </div>
          </div>
        </div>

        {/* Input textareas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
          {/* Left: Original */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Original</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => leftFileRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Open file"
                >
                  <Upload className="h-3 w-3" />
                  Open
                </button>
                <button
                  onClick={() => handleClear("left")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Clear"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <input
                  ref={leftFileRef}
                  type="file"
                  accept="text/*,.json,.xml,.csv,.yaml,.yml,.md,.js,.ts,.tsx,.jsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.html,.css,.sql,.sh,.env,.toml,.cfg,.ini,.log"
                  className="hidden"
                  onChange={handleFileLoad("left")}
                />
              </div>
            </div>
            <textarea
              value={original}
              onChange={(e) => {
                setOriginal(e.target.value);
                setDiffResult(null);
              }}
              placeholder="Paste or type original text here..."
              className="w-full h-64 lg:h-80 p-4 bg-card text-foreground font-mono text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
              spellCheck={false}
            />
          </div>

          {/* Right: Modified */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">Modified</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => rightFileRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Open file"
                >
                  <Upload className="h-3 w-3" />
                  Open
                </button>
                <button
                  onClick={() => handleClear("right")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Clear"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <input
                  ref={rightFileRef}
                  type="file"
                  accept="text/*,.json,.xml,.csv,.yaml,.yml,.md,.js,.ts,.tsx,.jsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.html,.css,.sql,.sh,.env,.toml,.cfg,.ini,.log"
                  className="hidden"
                  onChange={handleFileLoad("right")}
                />
              </div>
            </div>
            <textarea
              value={modified}
              onChange={(e) => {
                setModified(e.target.value);
                setDiffResult(null);
              }}
              placeholder="Paste or type modified text here..."
              className="w-full h-64 lg:h-80 p-4 bg-card text-foreground font-mono text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 animate-slide-up">
          <button
            onClick={handleFindDiff}
            disabled={!original && !modified}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4" />
            Find Differences
          </button>

          <button
            onClick={handleSwap}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Swap
          </button>

          <button
            onClick={() => handleClear("both")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>

          <button
            onClick={() => setShowOptions((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              showOptions
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            Options
          </button>

          {diffResult && (
            <CopyBtn text={diffText} label="Copy Diff" className="ml-auto" />
          )}
        </div>

        {/* Options panel */}
        {showOptions && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-accent" />
              Diff Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ToggleSwitch
                label="Ignore whitespace"
                checked={options.ignoreWhitespace}
                onChange={() => toggleOption("ignoreWhitespace")}
              />
              <ToggleSwitch
                label="Ignore case"
                checked={options.ignoreCase}
                onChange={() => toggleOption("ignoreCase")}
              />
              <ToggleSwitch
                label="Trim trailing whitespace"
                checked={options.trimTrailingWhitespace}
                onChange={() => toggleOption("trimTrailingWhitespace")}
              />
              <ToggleSwitch
                label="Show unchanged lines"
                checked={options.showUnchanged}
                onChange={() => toggleOption("showUnchanged")}
              />
            </div>
            {!options.showUnchanged && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Context lines:</label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={options.contextLines}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      contextLines: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            )}
          </div>
        )}

        {/* Stats bar */}
        {stats && diffResult && (
          <div className="rounded-xl border border-border bg-card p-4 animate-fade-in">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">Diff Stats</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">{stats.additions} addition{stats.additions !== 1 ? "s" : ""}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">{stats.deletions} deletion{stats.deletions !== 1 ? "s" : ""}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-muted-foreground">{stats.unchanged} unchanged</span>
                </span>
                <span className="text-muted-foreground">
                  {percentChanged}% changed
                </span>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span>Left: {formatBytes(leftSize)}</span>
                <span>Right: {formatBytes(rightSize)}</span>
              </div>
            </div>
            {/* Mini progress bar */}
            <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
              {stats.additions + stats.deletions + stats.unchanged > 0 && (
                <>
                  <div
                    className="bg-red-500 transition-all"
                    style={{
                      width: `${(stats.deletions / (stats.additions + stats.deletions + stats.unchanged)) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-green-500 transition-all"
                    style={{
                      width: `${(stats.additions / (stats.additions + stats.deletions + stats.unchanged)) * 100}%`,
                    }}
                  />
                  <div className="flex-1 bg-muted-foreground/20" />
                </>
              )}
            </div>
          </div>
        )}

        {/* View mode toggle */}
        {diffResult && displayLines && (
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-fit animate-fade-in">
            {viewModes.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  viewMode === key
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Diff output */}
        {diffResult && displayLines && (
          <div className="rounded-xl border border-border bg-card overflow-hidden animate-slide-up">
            {viewMode === "side-by-side" && (
              <SideBySideView lines={displayLines} groups={groups} />
            )}
            {viewMode === "unified" && (
              <UnifiedView lines={displayLines} groups={groups} />
            )}
            {viewMode === "inline" && (
              <InlineView lines={displayLines} groups={groups} />
            )}
          </div>
        )}

        {/* Empty state */}
        {!diffResult && (
          <div className="rounded-xl border border-border border-dashed bg-card/50 p-12 text-center animate-fade-in">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Paste or load text on both sides, then click <strong className="text-foreground">Find Differences</strong> to compare.
            </p>
          </div>
        )}

        {diffResult && displayLines && displayLines.length > 0 && stats && stats.additions === 0 && stats.deletions === 0 && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center animate-fade-in">
            <Check className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-sm font-medium text-success">Both texts are identical!</p>
          </div>
        )}
      </main>

      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">About this diff checker</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This <strong>online diff checker</strong> compares two texts
          side-by-side or in a unified view and highlights every addition,
          deletion, and unchanged line. It uses the Myers diff algorithm — the
          same algorithm used by Git — to find the minimum edit distance between
          the two inputs. Your text never leaves your browser.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Side-by-side vs unified diff</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Side-by-side</strong> — the two versions are shown in
            parallel columns. Easier to read when the files have many changes
            spread across different sections.
          </li>
          <li>
            <strong>Unified diff</strong> — changes are shown inline with{" "}
            <code className="font-mono text-xs">+</code> and{" "}
            <code className="font-mono text-xs">-</code> prefixes. The standard
            format used by Git patches and{" "}
            <code className="font-mono text-xs">diff -u</code> on the command
            line.
          </li>
        </ul>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Common use cases</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Comparing config files before and after a deployment</li>
          <li>Reviewing what a code generator or AI changed in a file</li>
          <li>Checking that a "find and replace" only modified the intended lines</li>
          <li>Comparing two versions of a legal document or contract</li>
          <li>
            For JSON-specific diffing with structure awareness, use the{" "}
            <a href="/tools/json-diff" className="text-accent hover:underline">
              JSON Diff
            </a>{" "}
            tool.
          </li>
        </ul>
      </section>

      <Footer />
    </>
  );
}

// ─── Toggle switch ──────────────────────────────────────────────────────

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

// ─── Side-by-side view ──────────────────────────────────────────────────

function SideBySideView({
  lines,
  groups,
}: {
  lines: DiffLine[];
  groups: DiffLine[][];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-2 min-w-[640px]">
        {/* Header */}
        <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
          Original
        </div>
        <div className="px-4 py-2 border-b border-l border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
          Modified
        </div>

        {/* Body */}
        {groups.map((group, gi) => {
          if (group.length === 1 && group[0].type === "unchanged") {
            const l = group[0];
            return (
              <SideBySideUnchangedRow key={gi} line={l} />
            );
          }

          const removed = group.filter((l) => l.type === "removed");
          const added = group.filter((l) => l.type === "added");
          const maxLen = Math.max(removed.length, added.length);

          return Array.from({ length: maxLen }, (_, idx) => {
            const rm = removed[idx];
            const ad = added[idx];
            const isPair = !!rm && !!ad;
            return (
              <SideBySideChangedRow
                key={`${gi}-${idx}`}
                removed={rm ?? null}
                added={ad ?? null}
                isPair={isPair}
              />
            );
          });
        })}
      </div>
    </div>
  );
}

function SideBySideUnchangedRow({ line }: { line: DiffLine }) {
  return (
    <>
      <div className="flex border-b border-border/50">
        <LineNum num={line.leftNum} />
        <pre className="flex-1 px-3 py-0.5 text-sm font-mono text-foreground/70 whitespace-pre-wrap break-all">
          {line.leftText}
        </pre>
      </div>
      <div className="flex border-b border-l border-border/50">
        <LineNum num={line.rightNum} />
        <pre className="flex-1 px-3 py-0.5 text-sm font-mono text-foreground/70 whitespace-pre-wrap break-all">
          {line.rightText}
        </pre>
      </div>
    </>
  );
}

function SideBySideChangedRow({
  removed,
  added,
  isPair,
}: {
  removed: DiffLine | null;
  added: DiffLine | null;
  isPair: boolean;
}) {
  return (
    <>
      {/* Left column */}
      <div
        className={`flex border-b border-border/50 ${
          removed ? "bg-red-500/10" : ""
        }`}
      >
        <LineNum num={removed?.leftNum ?? null} />
        <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all">
          {removed ? (
            isPair ? (
              <CharHighlightLeft
                oldText={removed.leftText}
                newText={added!.rightText}
              />
            ) : (
              <span className="text-red-700 dark:text-red-400">{removed.leftText}</span>
            )
          ) : null}
        </pre>
      </div>
      {/* Right column */}
      <div
        className={`flex border-b border-l border-border/50 ${
          added ? "bg-green-500/10" : ""
        }`}
      >
        <LineNum num={added?.rightNum ?? null} />
        <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all">
          {added ? (
            isPair ? (
              <CharHighlightRight
                oldText={removed!.leftText}
                newText={added.rightText}
              />
            ) : (
              <span className="text-green-700 dark:text-green-400">{added.rightText}</span>
            )
          ) : null}
        </pre>
      </div>
    </>
  );
}

// ─── Unified view ───────────────────────────────────────────────────────

function UnifiedView({
  lines,
  groups,
}: {
  lines: DiffLine[];
  groups: DiffLine[][];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
          Unified Diff
        </div>
        {groups.map((group, gi) => {
          if (group.length === 1 && group[0].type === "unchanged") {
            const l = group[0];
            return (
              <div key={gi} className="flex border-b border-border/50">
                <LineNum num={l.leftNum} />
                <LineNum num={l.rightNum} />
                <span className="w-5 shrink-0 text-center text-xs text-muted-foreground/50 py-0.5">&nbsp;</span>
                <pre className="flex-1 px-3 py-0.5 text-sm font-mono text-foreground/70 whitespace-pre-wrap break-all">
                  {l.leftText}
                </pre>
              </div>
            );
          }

          const removed = group.filter((l) => l.type === "removed");
          const added = group.filter((l) => l.type === "added");

          return (
            <div key={gi}>
              {removed.map((l, idx) => {
                const pairedAdd = added[idx];
                return (
                  <div
                    key={`r-${idx}`}
                    className="flex border-b border-border/50 bg-red-500/10"
                  >
                    <LineNum num={l.leftNum} />
                    <LineNum num={null} />
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-red-500 py-0.5">
                      −
                    </span>
                    <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all">
                      {pairedAdd ? (
                        <CharHighlightLeft oldText={l.leftText} newText={pairedAdd.rightText} />
                      ) : (
                        <span className="text-red-700 dark:text-red-400">{l.leftText}</span>
                      )}
                    </pre>
                  </div>
                );
              })}
              {added.map((l, idx) => {
                const pairedRm = removed[idx];
                return (
                  <div
                    key={`a-${idx}`}
                    className="flex border-b border-border/50 bg-green-500/10"
                  >
                    <LineNum num={null} />
                    <LineNum num={l.rightNum} />
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-green-500 py-0.5">
                      +
                    </span>
                    <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all">
                      {pairedRm ? (
                        <CharHighlightRight oldText={pairedRm.leftText} newText={l.rightText} />
                      ) : (
                        <span className="text-green-700 dark:text-green-400">{l.rightText}</span>
                      )}
                    </pre>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inline view ────────────────────────────────────────────────────────

function InlineView({
  lines,
  groups,
}: {
  lines: DiffLine[];
  groups: DiffLine[][];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">
          Inline Diff
        </div>
        {groups.map((group, gi) => {
          if (group.length === 1 && group[0].type === "unchanged") {
            const l = group[0];
            return (
              <div key={gi} className="flex border-b border-border/50">
                <LineNum num={l.leftNum} />
                <pre className="flex-1 px-3 py-0.5 text-sm font-mono text-foreground/70 whitespace-pre-wrap break-all">
                  {l.leftText}
                </pre>
              </div>
            );
          }

          const removed = group.filter((l) => l.type === "removed");
          const added = group.filter((l) => l.type === "added");
          const maxLen = Math.max(removed.length, added.length);

          return Array.from({ length: maxLen }, (_, idx) => {
            const rm = removed[idx];
            const ad = added[idx];

            if (rm && ad) {
              const { left, right } = computeCharDiff(rm.leftText, ad.rightText);
              return (
                <div key={`${gi}-${idx}`} className="flex border-b border-border/50 bg-amber-500/5">
                  <LineNum num={rm.leftNum} />
                  <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all">
                    {left.map((p, pi) =>
                      p.type === "removed" ? (
                        <span key={pi} className="bg-red-500/20 line-through text-red-700 dark:text-red-400">
                          {p.text}
                        </span>
                      ) : (
                        <span key={pi}>{p.text}</span>
                      )
                    )}
                    {right
                      .filter((p) => p.type === "added")
                      .map((p, pi) => (
                        <span key={`a-${pi}`} className="bg-green-500/20 underline text-green-700 dark:text-green-400">
                          {p.text}
                        </span>
                      ))}
                  </pre>
                </div>
              );
            }

            if (rm) {
              return (
                <div key={`${gi}-${idx}`} className="flex border-b border-border/50 bg-red-500/10">
                  <LineNum num={rm.leftNum} />
                  <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all line-through text-red-700 dark:text-red-400">
                    {rm.leftText}
                  </pre>
                </div>
              );
            }

            return (
              <div key={`${gi}-${idx}`} className="flex border-b border-border/50 bg-green-500/10">
                <LineNum num={ad!.rightNum} />
                <pre className="flex-1 px-3 py-0.5 text-sm font-mono whitespace-pre-wrap break-all underline text-green-700 dark:text-green-400">
                  {ad!.rightText}
                </pre>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

// ─── Line number gutter ─────────────────────────────────────────────────

function LineNum({ num }: { num: number | null }) {
  return (
    <span className="w-12 shrink-0 text-right pr-2 py-0.5 text-xs font-mono text-muted-foreground/50 select-none bg-muted/20 border-r border-border/50">
      {num ?? ""}
    </span>
  );
}
