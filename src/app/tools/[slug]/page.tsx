"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Download,
  Shield,
  Sparkles,
} from "lucide-react";
import { getToolBySlug, CATEGORIES } from "@/lib/tools-registry";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import * as engines from "@/lib/tool-engines";
import CustomToolOutlet from "@/components/tools/CustomToolOutlet";

const CUSTOM_TOOL_SLUGS = new Set([
  // rich UI workspaces
  "background-remover",
  "image-resizer", "image-compressor", "pdf-page-editor", "xml-suite",
  "qr-code", "age-calculator", "bmi-calculator", "compound-interest",
  "loan-emi-calculator", "contrast-checker", "gradient-generator", "currency-converter",
  // dev tools with rich UI
  "html-preview", "base64-image", "string-inspector", "markdown-preview",
  "regex-tester", "uuid-generator",
  "http-status-reference", "css-box-shadow",
  "image-format-converter", "svg-optimizer", "exif-viewer",
  "unicode-checker",
  // finance form tools
  "simple-interest", "gst-calculator", "discount-calculator",
  "tip-calculator", "roi-calculator", "profit-loss-calculator",
  // health form tools
  "bmr-calculator", "calorie-calculator", "water-intake-calculator", "body-fat-calculator",
  // math form tools
  "quadratic-solver", "pythagorean-theorem", "gcd-lcm-calculator",
  // datetime form tools
  "days-between-dates", "countdown-calculator", "week-number-calculator", "due-date-calculator",
]);

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      disabled={!text}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/** Browsers omit crypto.subtle on insecure HTTP (except localhost). */
function AesWebCryptoUnavailableHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(
      typeof globalThis.crypto !== "undefined" &&
        globalThis.crypto.subtle === undefined
    );
  }, []);
  if (!show) return null;
  return (
    <p
      role="status"
      className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2"
    >
      Web Crypto isn&apos;t available on this URL (needs HTTPS or{" "}
      <span className="font-mono">localhost</span>). Use a secure origin or AES
      encryption will fail.
    </p>
  );
}

type ToolState = {
  input: string;
  input2?: string;
  output: string;
  error: string;
  options: Record<string, string | number | boolean>;
};

export default function ToolPage() {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam ?? "";
  const tool = getToolBySlug(slug);
  const isCustomTool = Boolean(tool && CUSTOM_TOOL_SLUGS.has(slug));

  const [state, setState] = useState<ToolState>({
    input: "",
    input2: "",
    output: "",
    error: "",
    options: {},
  });

  const setInput = (input: string) => setState((s) => ({ ...s, input }));
  const setInput2 = (input2: string) => setState((s) => ({ ...s, input2 }));
  const setOption = (key: string, value: string | number | boolean) =>
    setState((s) => ({ ...s, options: { ...s.options, [key]: value } }));

  const process = useCallback(async () => {
    if (CUSTOM_TOOL_SLUGS.has(slug)) return;
    if (!state.input.trim() && !needsNoInput(slug)) {
      setState((s) => ({ ...s, output: "", error: "" }));
      return;
    }

    try {
      const result = await runTool(slug, state);
      setState((s) => ({
        ...s,
        output: typeof result === "string" ? result : result.output || "",
        error: typeof result === "string" ? "" : result.error || "",
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        output: "",
        error: e instanceof Error ? e.message : "An error occurred",
      }));
    }
  }, [slug, state.input, state.input2, state.options]);

  useEffect(() => {
    if (CUSTOM_TOOL_SLUGS.has(slug)) return;
    const timer = setTimeout(process, 150);
    return () => clearTimeout(timer);
  }, [process, slug]);

  if (!tool) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Tool Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The tool &quot;{slug}&quot; doesn&apos;t exist.
            </p>
            <Link
              href="/"
              className="text-accent hover:underline"
            >
              ← Back to tools
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (isCustomTool) {
    return (
      <>
        <Header />
        <CustomToolOutlet slug={slug} tool={tool} />
        <Footer />
      </>
    );
  }

  const category = CATEGORIES[tool.category];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tools
          </Link>
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-mono ${category.color}`}
            >
              {tool.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tool.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${category.color}`}
                >
                  {category.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  Runs in browser
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground max-w-prose">
                {tool.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tool options */}
        {renderOptions(slug, state.options, setOption)}

        {/* Input / Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">
          {/* Input */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                {tool.inputLabel || "Input"}
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      input: "",
                      output: "",
                      error: "",
                    }))
                  }
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                  title="Clear"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={state.input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste your ${tool.inputLabel?.toLowerCase() || "input"} here...`}
              className="flex-1 min-h-[300px] p-4 rounded-xl border border-border bg-card font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/50 scrollbar-thin"
              spellCheck={false}
            />
          </div>

          {/* Second input for diff-style tools */}
          {needsDualInput(slug) ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {tool.outputLabel || "Input B"}
                </label>
                <button
                  onClick={() => setInput2("")}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={state.input2}
                onChange={(e) => setInput2(e.target.value)}
                placeholder="Paste second input here..."
                className="flex-1 min-h-[300px] p-4 rounded-xl border border-border bg-card font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/50 scrollbar-thin"
                spellCheck={false}
              />
            </div>
          ) : (
            /* Output */
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {tool.outputLabel || "Output"}
                </label>
                <div className="flex items-center gap-1">
                  <CopyBtn text={state.output} />
                  {state.output && (
                    <button
                      onClick={() => {
                        const blob = new Blob([state.output], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${slug}-output.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={state.output}
                readOnly
                placeholder="Output will appear here..."
                className="flex-1 min-h-[300px] p-4 rounded-xl border border-border bg-muted/50 font-mono text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 scrollbar-thin"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Diff output for dual-input tools */}
        {needsDualInput(slug) && state.output && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Diff Result</label>
              <CopyBtn text={state.output} />
            </div>
            <pre className="p-4 rounded-xl border border-border bg-card font-mono text-sm overflow-auto max-h-[400px] scrollbar-thin whitespace-pre-wrap">
              {state.output.split("\n").map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("+")
                      ? "text-success bg-success/10"
                      : line.startsWith("-")
                        ? "text-destructive bg-destructive/10"
                        : line.startsWith("@@")
                          ? "text-accent"
                          : ""
                  }
                >
                  {line}
                </div>
              ))}
            </pre>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="mt-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 animate-fade-in">
            <p className="text-sm text-destructive font-medium">
              {state.error}
            </p>
          </div>
        )}

        {/* Stats */}
        {state.input && !state.error && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Input: {state.input.length} chars</span>
            {state.output && <span>Output: {state.output.length} chars</span>}
            {state.output && state.input.length > 0 && (
              <span>
                Ratio:{" "}
                {((state.output.length / state.input.length) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function needsDualInput(slug: string): boolean {
  return ["text-diff", "json-diff"].includes(slug);
}

function needsNoInput(slug: string): boolean {
  return [
    "uuid-generator",
    "lorem-ipsum",
    "password-generator",
    "timezone-converter",
    "world-clock",
  ].includes(slug);
}

function renderOptions(
  slug: string,
  options: Record<string, string | number | boolean>,
  setOption: (key: string, value: string | number | boolean) => void
) {
  const selectClass =
    "px-3 py-1.5 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring/40";
  const inputClass =
    "px-3 py-1.5 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring/40 w-20";

  switch (slug) {
    case "case-converter":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Target Case:</label>
          <select
            value={(options.targetCase as string) || "camelCase"}
            onChange={(e) => setOption("targetCase", e.target.value)}
            className={selectClass}
          >
            <option value="camelCase">camelCase</option>
            <option value="PascalCase">PascalCase</option>
            <option value="snake_case">snake_case</option>
            <option value="kebab-case">kebab-case</option>
            <option value="UPPER_CASE">UPPER_CASE</option>
            <option value="lower">lowercase</option>
            <option value="Title">Title Case</option>
            <option value="Sentence">Sentence case</option>
          </select>
        </div>
      );
    case "line-sorter":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Mode:</label>
          <select
            value={(options.mode as string) || "asc"}
            onChange={(e) => setOption("mode", e.target.value)}
            className={selectClass}
          >
            <option value="asc">Sort A → Z</option>
            <option value="desc">Sort Z → A</option>
            <option value="reverse">Reverse</option>
            <option value="shuffle">Shuffle</option>
            <option value="unique">Remove Duplicates</option>
          </select>
        </div>
      );
    case "lorem-ipsum":
      return (
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <label className="text-sm font-medium mr-2">Count:</label>
            <input
              type="number"
              min={1}
              max={50}
              value={(options.count as number) || 3}
              onChange={(e) => setOption("count", parseInt(e.target.value) || 3)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium mr-2">Unit:</label>
            <select
              value={(options.unit as string) || "paragraphs"}
              onChange={(e) => setOption("unit", e.target.value)}
              className={selectClass}
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
        </div>
      );
    case "uuid-generator":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Count:</label>
          <input
            type="number"
            min={1}
            max={25}
            value={(options.count as number) || 5}
            onChange={(e) => setOption("count", parseInt(e.target.value) || 5)}
            className={inputClass}
          />
        </div>
      );
    case "password-generator":
      return (
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-sm font-medium mr-2">Length:</label>
            <input
              type="number"
              min={4}
              max={128}
              value={(options.length as number) || 16}
              onChange={(e) =>
                setOption("length", parseInt(e.target.value) || 16)
              }
              className={inputClass}
            />
          </div>
          {["Uppercase", "Lowercase", "Digits", "Symbols"].map((opt) => {
            const key = opt.toLowerCase();
            return (
              <label key={opt} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={options[key] !== false}
                  onChange={(e) => setOption(key, e.target.checked)}
                  className="rounded"
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    case "string-escape":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Mode:</label>
          <select
            value={(options.mode as string) || "json"}
            onChange={(e) => setOption("mode", e.target.value)}
            className={selectClass}
          >
            <option value="json">JSON</option>
            <option value="js">JavaScript</option>
            <option value="sql">SQL</option>
            <option value="regex">Regex</option>
          </select>
        </div>
      );
    case "curl-formatter":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Output:</label>
          <select
            value={(options.layout as string) || "multiline"}
            onChange={(e) => setOption("layout", e.target.value)}
            className={selectClass}
          >
            <option value="multiline">Multi-line (POSIX / bash)</option>
            <option value="oneline">Single line</option>
          </select>
        </div>
      );
    case "base-converter":
      return (
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <label className="text-sm font-medium mr-2">From:</label>
            <select
              value={(options.fromBase as number) || 10}
              onChange={(e) => setOption("fromBase", parseInt(e.target.value))}
              className={selectClass}
            >
              <option value={2}>Binary (2)</option>
              <option value={8}>Octal (8)</option>
              <option value={10}>Decimal (10)</option>
              <option value={16}>Hex (16)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mr-2">To:</label>
            <select
              value={(options.toBase as number) || 16}
              onChange={(e) => setOption("toBase", parseInt(e.target.value))}
              className={selectClass}
            >
              <option value={2}>Binary (2)</option>
              <option value={8}>Octal (8)</option>
              <option value={10}>Decimal (10)</option>
              <option value={16}>Hex (16)</option>
            </select>
          </div>
        </div>
      );
    case "whitespace-normalizer":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Mode:</label>
          <select
            value={(options.mode as string) || "collapse"}
            onChange={(e) => setOption("mode", e.target.value)}
            className={selectClass}
          >
            <option value="collapse">Collapse spaces</option>
            <option value="trim">Trim lines</option>
            <option value="remove-blank">Remove blank lines</option>
            <option value="single-space">Single space between words</option>
            <option value="all">All normalizations</option>
          </select>
        </div>
      );
    case "find-replace":
      return (
        <div className="mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm font-medium block mb-1">Find:</label>
            <input
              type="text"
              value={(options.find as string) || ""}
              onChange={(e) => setOption("find", e.target.value)}
              placeholder="Search text"
              className={`${selectClass} w-48`}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Replace:</label>
            <input
              type="text"
              value={(options.replace as string) || ""}
              onChange={(e) => setOption("replace", e.target.value)}
              placeholder="Replace with"
              className={`${selectClass} w-48`}
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm pb-1.5">
            <input
              type="checkbox"
              checked={!!options.useRegex}
              onChange={(e) => setOption("useRegex", e.target.checked)}
              className="rounded"
            />
            Regex
          </label>
          <label className="flex items-center gap-1.5 text-sm pb-1.5">
            <input
              type="checkbox"
              checked={!!options.caseInsensitive}
              onChange={(e) => setOption("caseInsensitive", e.target.checked)}
              className="rounded"
            />
            Case insensitive
          </label>
        </div>
      );
    case "unit-converter": {
      const unitOptions: Record<string, string[]> = {
        length: ["mm", "cm", "m", "km", "inch", "ft", "yd", "mi", "nm"],
        weight: ["mg", "g", "kg", "t", "oz", "lb", "st"],
        area: ["mm²", "cm²", "m²", "km²", "in²", "ft²", "yd²", "mi²", "ha", "ac"],
        volume: ["ml", "cl", "dl", "l", "m³", "tsp", "tbsp", "fl oz", "cup", "pt", "qt", "gal", "in³", "ft³"],
        speed: ["m/s", "km/h", "mph", "knot", "ft/s", "mach"],
        temperature: ["C", "F", "K"],
      };
      const cat = (options.unitCategory as string) || "length";
      const units = unitOptions[cat] || unitOptions.length;
      return (
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <label className="text-sm font-medium mr-2">Category:</label>
            <select value={cat} onChange={(e) => setOption("unitCategory", e.target.value)} className={selectClass}>
              {Object.keys(unitOptions).map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mr-2">From:</label>
            <select value={(options.unitFrom as string) || units[0]} onChange={(e) => setOption("unitFrom", e.target.value)} className={selectClass}>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mr-2">To:</label>
            <select value={(options.unitTo as string) || units[1]} onChange={(e) => setOption("unitTo", e.target.value)} className={selectClass}>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      );
    }
    case "temperature-converter":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">From:</label>
          <select
            value={(options.from as string) || "C"}
            onChange={(e) => setOption("from", e.target.value)}
            className={selectClass}
          >
            <option value="C">Celsius</option>
            <option value="F">Fahrenheit</option>
            <option value="K">Kelvin</option>
          </select>
        </div>
      );
    case "byte-converter":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">From Unit:</label>
          <select
            value={(options.fromUnit as string) || "B"}
            onChange={(e) => setOption("fromUnit", e.target.value)}
            className={selectClass}
          >
            {["B", "KB", "MB", "GB", "TB", "PB"].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      );
    case "hash-generator":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">Algorithm:</label>
          <select
            value={(options.algo as string) || "SHA-256"}
            onChange={(e) => setOption("algo", e.target.value)}
            className={selectClass}
          >
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
        </div>
      );
    case "aes-encrypt-decrypt": {
      const pwGenLen = Math.min(
        128,
        Math.max(4, (options.aesPwLen as number) || 24)
      );
      const pwGenOpts = {
        uppercase: options.aesPwUppercase !== false,
        lowercase: options.aesPwLowercase !== false,
        digits: options.aesPwDigits !== false,
        symbols: options.aesPwSymbols !== false,
      };
      const fillGeneratedPassword = () => {
        const r = engines.generatePassword(pwGenLen, pwGenOpts);
        if (typeof r === "string") {
          setOption("password", r);
          return;
        }
        if (!r.error && r.output) setOption("password", r.output);
      };

      return (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-sm font-medium block mb-1">Mode:</label>
              <select
                value={(options.mode as string) || "encrypt"}
                onChange={(e) => setOption("mode", e.target.value)}
                className={selectClass}
              >
                <option value="encrypt">Encrypt</option>
                <option value="decrypt">Decrypt</option>
              </select>
            </div>
            <div className="min-w-[12rem] flex-1 max-w-md">
              <label className="text-sm font-medium block mb-1">Password:</label>
              <input
                type="password"
                value={(options.password as string) || ""}
                onChange={(e) => setOption("password", e.target.value)}
                placeholder="Enter password…"
                autoComplete="off"
                className={selectClass + " w-full"}
              />
            </div>
            <p className="text-xs text-muted-foreground py-1.5 max-w-xs">
              AES-256-GCM · PBKDF2 key derivation · client-side only
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/25 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Password generator
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <label className="text-xs font-medium mr-2">Length:</label>
                <input
                  type="number"
                  min={4}
                  max={128}
                  value={(options.aesPwLen as number) || 24}
                  onChange={(e) =>
                    setOption("aesPwLen", parseInt(e.target.value) || 24)
                  }
                  className={inputClass}
                />
              </div>
              {(
                [
                  ["Uppercase", "aesPwUppercase"],
                  ["Lowercase", "aesPwLowercase"],
                  ["Digits", "aesPwDigits"],
                  ["Symbols", "aesPwSymbols"],
                ] as const
              ).map(([label, key]) => (
                <label key={key} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={options[key] !== false}
                    onChange={(e) => setOption(key, e.target.checked)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
              <button
                type="button"
                onClick={fillGeneratedPassword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill password
              </button>
            </div>
          </div>

          <AesWebCryptoUnavailableHint />
        </div>
      );
    }
    case "gst-calculator":
      return (
        <div className="mb-4">
          <label className="text-sm font-medium mr-2">GST basis:</label>
          <select
            value={(options.gstBasis as string) || "exclusive"}
            onChange={(e) => setOption("gstBasis", e.target.value)}
            className={selectClass}
          >
            <option value="exclusive">Add GST to net amount</option>
            <option value="inclusive">Extract GST from gross</option>
          </select>
        </div>
      );
    default:
      return null;
  }
}

async function runTool(
  slug: string,
  state: ToolState
): Promise<string | { output: string; error?: string }> {
  const { input, input2, options } = state;

  switch (slug) {
    // Encoding
    case "base64-encode":
      return engines.base64Encode(input);
    case "base64-decode":
      return engines.base64Decode(input);
    case "url-encode":
      return engines.urlEncode(input);
    case "url-decode":
      return engines.urlDecode(input);
    case "html-entity-encode":
      return engines.htmlEntityEncode(input);
    case "html-entity-decode":
      return engines.htmlEntityDecode(input);
    case "text-to-hex":
      return engines.textToHex(input);
    case "hex-to-text":
      return engines.hexToText(input);
    case "text-to-binary":
      return engines.textToBinary(input);
    case "binary-to-text":
      return engines.binaryToText(input);
    case "rot13":
      return engines.rot13(input);
    case "morse-code":
      return engines.morseEncode(input);

    // Text
    case "case-converter":
      return engines.caseConvert(
        input,
        (options.targetCase as string) || "camelCase"
      );
    case "text-diff":
      return engines.textDiff(input, input2 || "");
    case "word-counter": {
      const stats = engines.wordCount(input);
      return {
        output: Object.entries(stats)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n"),
      };
    }
    case "regex-tester":
      return engines.regexTest(input, (options.pattern as string) || "");
    case "slug-generator":
      return engines.slugify(input);
    case "lorem-ipsum":
      return engines.loremIpsum(
        (options.count as number) || 3,
        (options.unit as "paragraphs" | "sentences" | "words") || "paragraphs"
      );
    case "line-sorter":
      return engines.sortLines(input, (options.mode as string) || "asc");
    case "find-replace":
      return engines.findReplace(
        input,
        (options.find as string) || "",
        (options.replace as string) || "",
        !!options.useRegex,
        !!options.caseInsensitive
      );
    case "whitespace-normalizer":
      return engines.normalizeWhitespace(
        input,
        (options.mode as string) || "collapse"
      );
    case "string-reverse":
      return engines.reverseString(input);
    case "markdown-to-html":
      return engines.markdownToHtml(input);
    case "html-to-markdown":
      return engines.htmlToMarkdown(input);
    case "html-to-text":
      return engines.htmlToText(input);
    case "strip-markdown":
      return engines.stripMarkdown(input);

    // Dev
    case "aes-encrypt-decrypt": {
      const password = (options.password as string) || "";
      if (!password) return { output: "", error: "Password is required" };
      const mode = (options.mode as string) || "encrypt";
      try {
        if (mode === "encrypt") {
          const result = await engines.aesEncrypt(input, password);
          return result;
        } else {
          const result = await engines.aesDecrypt(input, password);
          return result;
        }
      } catch (e) {
        return { output: "", error: `${mode === "encrypt" ? "Encryption" : "Decryption"} failed: ${(e as Error).message}` };
      }
    }
    case "hash-generator": {
      const hash = await engines.generateHash(
        input,
        (options.algo as string) || "SHA-256"
      );
      return hash;
    }
    case "uuid-generator":
      return engines
        .generateUuids((options.count as number) || 5)
        .join("\n");
    case "color-converter":
      return engines.convertColor(input);
    case "unix-timestamp":
      return engines.unixTimestamp(input);
    case "cron-parser":
      return engines.parseCron(input);
    case "password-generator":
      return engines.generatePassword((options.length as number) || 16, {
        uppercase: options.uppercase !== false,
        lowercase: options.lowercase !== false,
        digits: options.digits !== false,
        symbols: options.symbols !== false,
      });
    case "url-parser":
      return engines.parseUrl(input);
    case "base-converter":
      return engines.convertBase(
        input,
        (options.fromBase as number) || 10,
        (options.toBase as number) || 16
      );
    case "css-minifier":
      return engines.minifyCss(input);
    case "html-minifier":
      return engines.minifyHtml(input);
    case "sql-formatter":
      return engines.formatSql(input);
    case "curl-to-fetch":
      return engines.curlToFetch(input);
    case "curl-formatter":
      return engines.formatCurl(
        input,
        (options.layout as string) === "oneline" ? "oneline" : "multiline"
      );
    case "string-escape":
      return engines.escapeString(
        input,
        (options.mode as "json" | "js" | "sql" | "regex") || "json"
      );
    case "mime-lookup":
      return engines.mimeLookup(input);

    // Conversion
    case "unit-converter":
      return engines.convertUnits(
        parseFloat(input) || 0,
        (options.unitFrom as string) || "m",
        (options.unitTo as string) || "km",
        (options.unitCategory as string) || "length"
      );
    case "temperature-converter":
      return engines.convertTemperature(
        parseFloat(input) || 0,
        (options.from as "C" | "F" | "K") || "C"
      );
    case "byte-converter":
      return engines.convertBytes(
        parseFloat(input) || 0,
        (options.fromUnit as string) || "B"
      );
    case "number-to-words":
      return engines.numberToWords(parseInt(input) || 0);
    case "roman-numerals": {
      if (/^\d+$/.test(input.trim())) {
        return engines.toRomanNumeral(parseInt(input));
      }
      const decimal = engines.fromRomanNumeral(input.trim().toUpperCase());
      return typeof decimal === "number" ? String(decimal) : decimal;
    }
    case "duration-converter":
      return engines.convertDuration(parseFloat(input) || 0);
    case "percentage-calc":
      return engines.calculatePercentage(input);
    case "aspect-ratio": {
      const parts = input.split(/[x×:,\s]+/);
      const w = parseFloat(parts[0]) || 0;
      const h = parseFloat(parts[1]) || 0;
      if (w && h) return engines.calculateAspectRatio(w, h);
      return { output: "", error: "Enter dimensions as WxH (e.g. 1920x1080)" };
    }
    case "timezone-converter":
    case "world-clock":
      return engines.convertTimezone(input);

    // Finance & calculators (Tool Stack parity)
    case "simple-interest":
      return engines.calcSimpleInterest(input);
    case "gst-calculator":
      return engines.calcGst(
        input,
        (options.gstBasis as string) === "inclusive" ? "inclusive" : "exclusive"
      );
    case "discount-calculator":
      return engines.calcDiscount(input);
    case "tip-calculator":
      return engines.calcTip(input);
    case "roi-calculator":
      return engines.calcRoi(input);
    case "profit-loss-calculator":
      return engines.calcProfitLoss(input);
    case "bmr-calculator":
      return engines.calcBmr(input);
    case "calorie-calculator":
      return engines.calcCalorieCalculator(input);
    case "water-intake-calculator":
      return engines.calcWaterIntake(input);
    case "body-fat-calculator":
      return engines.calcBodyFatEstimate(input);
    case "days-between-dates":
      return engines.calcDaysBetween(input);
    case "countdown-calculator":
      return engines.calcCountdown(input);
    case "week-number-calculator":
      return engines.calcWeekNumber(input);
    case "due-date-calculator":
      return engines.calcDueDateFromLmp(input);
    case "quadratic-solver":
      return engines.solveQuadraticEquation(input);
    case "pythagorean-theorem":
      return engines.solvePythagorean(input);
    case "gcd-lcm-calculator":
      return engines.calcGcdLcmPair(input);

    // JSON conversion tools
    case "json-to-yaml":
      return engines.jsonToYaml(input);
    case "yaml-to-json":
      return engines.yamlToJson(input);
    case "json-to-csv":
      return engines.jsonToCsv(input);
    case "csv-to-json":
      return engines.csvToJson(input);
    case "json-to-typescript":
      return engines.jsonToTypescript(input);
    case "json-to-xml":
      return engines.jsonToXml(input);
    case "xml-to-json":
      return engines.xmlToJson(input);
    case "json-diff":
      return engines.textDiff(input, input2 || "");
    case "toml-to-json":
      return engines.tomlToJson(input);
    case "html-to-jsx":
      return engines.htmlToJsx(input);

    default:
      return { output: "", error: `Tool "${slug}" is not yet implemented.` };
  }
}
