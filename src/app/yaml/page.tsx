"use client";

import { useState, useMemo, useCallback } from "react";
import * as yaml from "js-yaml";
import {
  Copy, Check, Trash2, Download, ChevronDown, ChevronRight,
  AlertCircle, CheckCircle2, ArrowRightLeft, Wand2, AlertTriangle,
} from "lucide-react";
import Header from "@/components/Header";
import {
  trackToolSuccess,
  trackToolCopy,
} from "@/lib/analytics-events";

const TOOL_SLUG = "yaml";

// ── YAML helpers ─────────────────────────────────────────────────────────────

function formatYaml(input: string): { output: string; error: string | null } {
  try {
    const docs: unknown[] = [];
    yaml.loadAll(input, (doc) => docs.push(doc));
    if (docs.length === 0) return { output: "", error: null };
    const formatted = docs
      .map((d) => yaml.dump(d, { indent: 2, lineWidth: 120, noRefs: false }))
      .join("---\n");
    return { output: formatted.trimEnd(), error: null };
  } catch (e) {
    return { output: "", error: (e as Error).message };
  }
}

function yamlToJson(input: string): { output: string; error: string | null } {
  try {
    const doc = yaml.load(input);
    return { output: JSON.stringify(doc, null, 2), error: null };
  } catch (e) {
    return { output: "", error: (e as Error).message };
  }
}

function jsonToYaml(input: string): { output: string; error: string | null } {
  try {
    const obj = JSON.parse(input);
    return { output: yaml.dump(obj, { indent: 2, lineWidth: 120 }).trimEnd(), error: null };
  } catch (e) {
    return { output: "", error: (e as Error).message };
  }
}

// ── Auto-fix ──────────────────────────────────────────────────────────────────

interface FixResult {
  output: string;
  fixes: string[];
}

function autoFix(input: string): FixResult {
  const fixes: string[] = [];
  let text = input;

  // 1. CRLF → LF
  if (text.includes("\r\n")) {
    text = text.replace(/\r\n/g, "\n");
    fixes.push("Converted Windows line endings (CRLF → LF)");
  }

  // 2. Tabs → 2 spaces (most common YAML error)
  if (/^\t/m.test(text)) {
    text = text.replace(/^(\t+)/gm, (tabs) => "  ".repeat(tabs.length));
    fixes.push("Replaced tab indentation with 2 spaces");
  }

  // 3. Trailing whitespace on each line
  const trimmed = text.replace(/[ \t]+$/gm, "");
  if (trimmed !== text) {
    text = trimmed;
    fixes.push("Removed trailing whitespace");
  }

  // 4. Multiple consecutive blank lines → single blank line
  const singleBlanks = text.replace(/\n{3,}/g, "\n\n");
  if (singleBlanks !== text) {
    text = singleBlanks;
    fixes.push("Collapsed multiple blank lines");
  }

  // 5. Leading blank lines
  const noLeading = text.replace(/^\n+/, "");
  if (noLeading !== text) {
    text = noLeading;
    fixes.push("Removed leading blank lines");
  }

  // 6. If parseable after fixes, reformat for consistent indentation
  const parsed = formatYaml(text);
  if (!parsed.error && parsed.output) {
    if (parsed.output !== text.trimEnd()) {
      text = parsed.output;
      fixes.push("Reformatted with consistent 2-space indentation");
    }
  }

  return { output: text, fixes };
}

// ── Validate ──────────────────────────────────────────────────────────────────

interface ValidationIssue {
  type: "error" | "warning";
  message: string;
  line?: number;
}

function validate(input: string): { issues: ValidationIssue[]; valid: boolean } {
  if (!input.trim()) return { issues: [], valid: true };

  const issues: ValidationIssue[] = [];

  // Syntax check via js-yaml
  try {
    yaml.loadAll(input, () => {});
  } catch (e) {
    const err = e as yaml.YAMLException;
    issues.push({
      type: "error",
      message: err.reason ?? err.message,
      line: err.mark?.line ? err.mark.line + 1 : undefined,
    });
    return { issues, valid: false };
  }

  // Lint-style warnings
  const lines = input.split("\n");
  lines.forEach((line, i) => {
    const ln = i + 1;

    // Tab indentation
    if (/^\t/.test(line)) {
      issues.push({ type: "error", message: `Tab indentation not allowed in YAML`, line: ln });
    }

    // Trailing whitespace
    if (/[ \t]+$/.test(line)) {
      issues.push({ type: "warning", message: `Trailing whitespace`, line: ln });
    }

    // Windows line endings (CRLF)
    if (line.endsWith("\r")) {
      issues.push({ type: "warning", message: `Windows line ending (CRLF) detected`, line: ln });
    }

    // Lines over 120 chars
    if (line.length > 120) {
      issues.push({ type: "warning", message: `Line exceeds 120 characters (${line.length} chars)`, line: ln });
    }

    // Duplicate key detection in same block (basic)
    const keyMatch = line.match(/^(\s*)([^#\s][^:]*)\s*:/);
    if (keyMatch) {
      const indent = keyMatch[1].length;
      const key = keyMatch[2].trim();
      const sameIndentKeys = lines
        .slice(0, i)
        .filter((l) => {
          const m = l.match(/^(\s*)([^#\s][^:]*)\s*:/);
          return m && m[1].length === indent && m[2].trim() === key;
        });
      if (sameIndentKeys.length > 0) {
        issues.push({ type: "warning", message: `Possible duplicate key: "${key}"`, line: ln });
      }
    }
  });

  return { issues, valid: issues.filter((i) => i.type === "error").length === 0 };
}

// ── Tree ──────────────────────────────────────────────────────────────────────

function YamlTreeNode({ label, value, depth = 0 }: { label: string; value: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isObj = value !== null && typeof value === "object";
  const entries = isObj
    ? Array.isArray(value)
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>)
    : [];

  const typeColor =
    typeof value === "string" ? "text-green-600 dark:text-green-400" :
    typeof value === "number" ? "text-blue-600 dark:text-blue-400" :
    typeof value === "boolean" ? "text-purple-600 dark:text-purple-400" :
    value === null ? "text-muted-foreground" : "text-foreground";

  return (
    <div className="font-mono text-xs leading-relaxed">
      <div
        className={`flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted/40 ${isObj ? "cursor-pointer" : "cursor-default"} select-none`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => isObj && setOpen((o) => !o)}
      >
        {isObj
          ? open ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
                 : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
          : <span className="w-3 shrink-0" />}
        <span className="text-accent font-medium">{label}</span>
        {isObj
          ? <span className="text-muted-foreground ml-1">{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
          : <span className={`ml-1 ${typeColor}`}>{value === null ? "null" : String(value)}</span>}
      </div>
      {isObj && open && entries.map(([k, v]) => <YamlTreeNode key={k} label={k} value={v} depth={depth + 1} />)}
    </div>
  );
}

// ── CopyBtn ───────────────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        trackToolCopy(TOOL_SLUG, label);
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

type Tab = "format" | "validate" | "yaml-to-json" | "json-to-yaml";

const TABS: { id: Tab; label: string }[] = [
  { id: "format",       label: "Format" },
  { id: "validate",     label: "Validate & Lint" },
  { id: "yaml-to-json", label: "YAML → JSON" },
  { id: "json-to-yaml", label: "JSON → YAML" },
];

const SAMPLE_YAML = `# DevBench sample
name: DevBench
version: "1.0.0"
description: Free online developer tools

features:
  - name: JSON Tools
    workspace: /json
  - name: YAML Formatter
    workspace: /yaml

settings:
  theme: dark
  analytics: true
  maxTools: 100

database:
  host: localhost
  port: 5432
  credentials: &creds
    user: admin
    password: secret

replica:
  <<: *creds
  host: replica.db.local
`;

const SAMPLE_YAML_BROKEN = `name: DevBench
version: 1.0.0
	description: uses tabs here
features:
  - name: JSON Tools
  - name: JSON Tools
settings:
  theme: dark
  theme: light


`;

const SAMPLE_JSON = `{
  "name": "DevBench",
  "version": "1.0.0",
  "features": [
    { "name": "JSON Tools", "workspace": "/json" },
    { "name": "YAML Formatter", "workspace": "/yaml" }
  ],
  "settings": {
    "theme": "dark",
    "analytics": true
  }
}`;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function YamlPage() {
  const [tab, setTab] = useState<Tab>("format");
  const [fmtInput, setFmtInput] = useState(SAMPLE_YAML);
  const [valInput, setValInput] = useState(SAMPLE_YAML_BROKEN);
  const [y2jInput, setY2jInput] = useState(SAMPLE_YAML);
  const [j2yInput, setJ2yInput] = useState(SAMPLE_JSON);
  const [showTree, setShowTree] = useState(false);
  const [fixResult, setFixResult] = useState<{ output: string; fixes: string[] } | null>(null);

  const fmtResult  = useMemo(() => formatYaml(fmtInput),  [fmtInput]);
  const valResult  = useMemo(() => validate(valInput),     [valInput]);
  const y2jResult  = useMemo(() => yamlToJson(y2jInput),   [y2jInput]);
  const j2yResult  = useMemo(() => jsonToYaml(j2yInput),   [j2yInput]);

  const treeData = useMemo(() => {
    if (!showTree) return null;
    try { return yaml.load(fmtInput) as Record<string, unknown>; } catch { return null; }
  }, [fmtInput, showTree]);

  const download = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    const ext = filename.split(".").pop() ?? "txt";
    trackToolSuccess(TOOL_SLUG, "download", { format: ext });
  }, []);

  const runAutoFix = useCallback(() => {
    const result = autoFix(valInput);
    setFixResult(result);
    setValInput(result.output);
  }, [valInput]);

  const applyFmtOutput = useCallback(() => {
    if (fmtResult.output) setFmtInput(fmtResult.output);
  }, [fmtResult.output]);

  const errCount  = valResult.issues.filter((i) => i.type === "error").length;
  const warnCount = valResult.issues.filter((i) => i.type === "warning").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-4">

        <div>
          <h1 className="text-2xl font-bold">YAML Formatter, Validator & Converter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Format, validate, auto-fix, and convert YAML — supports anchors, aliases, multi-document streams
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.id === "yaml-to-json" && <ArrowRightLeft className="w-3.5 h-3.5" />}
              {t.id === "validate" && (valResult.issues.length > 0
                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                : valInput.trim() ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : null
              )}
              {t.label}
              {t.id === "validate" && valResult.issues.length > 0 && (
                <span className="ml-1 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold px-1.5 py-0.5">
                  {valResult.issues.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Format tab ── */}
        {tab === "format" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Input YAML</span>
                  <button onClick={() => setFmtInput("")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Clear">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={fmtInput}
                  onChange={(e) => setFmtInput(e.target.value)}
                  spellCheck={false}
                  rows={22}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              {/* Output */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formatted</span>
                    {fmtInput && (fmtResult.error
                      ? <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5" />Invalid</span>
                      : <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="w-3.5 h-3.5" />Valid</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {fmtResult.output && (
                      <button
                        onClick={applyFmtOutput}
                        title="Replace input with formatted output"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" /> Apply
                      </button>
                    )}
                    {fmtResult.output && <CopyBtn text={fmtResult.output} />}
                    {fmtResult.output && (
                      <button onClick={() => download(fmtResult.output, "formatted.yaml")}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
                        <Download className="w-3.5 h-3.5" /> Save
                      </button>
                    )}
                  </div>
                </div>
                {fmtResult.error
                  ? <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-mono text-destructive whitespace-pre-wrap flex-1">{fmtResult.error}</div>
                  : <textarea readOnly value={fmtResult.output} rows={22}
                      className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-mono resize-y focus:outline-none" />
                }
              </div>
            </div>

            {/* Tree toggle */}
            <div>
              <button onClick={() => setShowTree((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors">
                {showTree ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                Tree View
              </button>
              {showTree && treeData && (
                <div className="mt-2 rounded-xl border border-border bg-card p-3 overflow-auto max-h-80">
                  {Object.entries(treeData).map(([k, v]) => <YamlTreeNode key={k} label={k} value={v} depth={0} />)}
                </div>
              )}
              {showTree && !treeData && fmtInput && (
                <p className="mt-2 text-sm text-muted-foreground px-1">Fix YAML errors to see tree view.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Validate & Lint tab ── */}
        {tab === "validate" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">YAML to validate</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={runAutoFix}
                      disabled={!valInput.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 transition-all font-medium"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> Auto-Fix
                    </button>
                    <button onClick={() => { setValInput(""); setFixResult(null); }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Clear">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={valInput}
                  onChange={(e) => { setValInput(e.target.value); setFixResult(null); }}
                  spellCheck={false}
                  rows={20}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <p className="text-xs text-muted-foreground px-1">
                  Tip: try pasting broken YAML with tabs or duplicate keys, then click <strong>Auto-Fix</strong>.
                </p>
              </div>

              {/* Results panel */}
              <div className="flex flex-col gap-3">
                {/* Summary badge */}
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                  !valInput.trim()
                    ? "border-border bg-muted/30"
                    : valResult.valid
                    ? "border-green-400/30 bg-green-50/60 dark:bg-green-950/20"
                    : "border-destructive/30 bg-destructive/5"
                }`}>
                  {!valInput.trim()
                    ? <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    : valResult.valid
                    ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    : <AlertCircle className="w-5 h-5 text-destructive" />}
                  <div>
                    <div className="text-sm font-semibold">
                      {!valInput.trim() ? "Paste YAML to validate" : valResult.valid ? "Valid YAML" : "Invalid YAML"}
                    </div>
                    {valInput.trim() && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {errCount > 0 && <span className="text-destructive">{errCount} error{errCount !== 1 ? "s" : ""}</span>}
                        {errCount > 0 && warnCount > 0 && <span> · </span>}
                        {warnCount > 0 && <span className="text-amber-600 dark:text-amber-400">{warnCount} warning{warnCount !== 1 ? "s" : ""}</span>}
                        {errCount === 0 && warnCount === 0 && <span className="text-green-600 dark:text-green-400">No issues found</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-fix results */}
                {fixResult && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                      <Wand2 className="w-4 h-4" />
                      Auto-Fix applied {fixResult.fixes.length} change{fixResult.fixes.length !== 1 ? "s" : ""}
                    </div>
                    <ul className="space-y-0.5">
                      {fixResult.fixes.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {fixResult.fixes.length === 0 && (
                      <p className="text-xs text-muted-foreground">Nothing to fix automatically.</p>
                    )}
                  </div>
                )}

                {/* Issue list */}
                {valResult.issues.length > 0 && (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-3 py-2 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                      Issues
                    </div>
                    <div className="divide-y divide-border max-h-64 overflow-auto">
                      {valResult.issues.map((issue, i) => (
                        <div key={i} className={`flex items-start gap-3 px-3 py-2.5 ${issue.type === "error" ? "bg-destructive/3" : ""}`}>
                          {issue.type === "error"
                            ? <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                            : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-foreground">{issue.message}</span>
                          </div>
                          {issue.line && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                              line {issue.line}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {valInput.trim() && valResult.issues.length === 0 && (
                  <div className="rounded-xl border border-green-400/30 bg-green-50/40 dark:bg-green-950/10 px-4 py-8 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Perfectly clean YAML</p>
                    <p className="text-xs text-muted-foreground mt-1">No syntax errors, no warnings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── YAML → JSON tab ── */}
        {tab === "yaml-to-json" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Input YAML</span>
                <button onClick={() => setY2jInput("")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Clear"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea value={y2jInput} onChange={(e) => setY2jInput(e.target.value)} spellCheck={false} rows={24}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">JSON Output</span>
                  {y2jInput && (y2jResult.error
                    ? <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5" />Error</span>
                    : <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="w-3.5 h-3.5" />OK</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {y2jResult.output && <CopyBtn text={y2jResult.output} />}
                  {y2jResult.output && <button onClick={() => download(y2jResult.output, "output.json")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
                    <Download className="w-3.5 h-3.5" /> Save</button>}
                </div>
              </div>
              {y2jResult.error
                ? <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-mono text-destructive whitespace-pre-wrap">{y2jResult.error}</div>
                : <textarea readOnly value={y2jResult.output} rows={24}
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-mono resize-y focus:outline-none" />}
            </div>
          </div>
        )}

        {/* ── JSON → YAML tab ── */}
        {tab === "json-to-yaml" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Input JSON</span>
                <button onClick={() => setJ2yInput("")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Clear"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea value={j2yInput} onChange={(e) => setJ2yInput(e.target.value)} spellCheck={false} rows={24}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">YAML Output</span>
                  {j2yInput && (j2yResult.error
                    ? <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5" />Error</span>
                    : <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle2 className="w-3.5 h-3.5" />OK</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {j2yResult.output && <CopyBtn text={j2yResult.output} />}
                  {j2yResult.output && <button onClick={() => download(j2yResult.output, "output.yaml")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
                    <Download className="w-3.5 h-3.5" /> Save</button>}
                </div>
              </div>
              {j2yResult.error
                ? <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-mono text-destructive whitespace-pre-wrap">{j2yResult.error}</div>
                : <textarea readOnly value={j2yResult.output} rows={24}
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-mono resize-y focus:outline-none" />}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
