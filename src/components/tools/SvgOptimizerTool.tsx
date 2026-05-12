"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, Download, Upload, Sparkles } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";
import { trackToolDownload, trackToolCopy } from "@/lib/analytics-events";

interface OptimizeResult {
  output: string;
  originalSize: number;
  optimizedSize: number;
  removals: string[];
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

function optimizeSvg(
  input: string,
  opts: {
    removeComments: boolean;
    removeMetadata: boolean;
    removeEditorData: boolean;
    removeHiddenElements: boolean;
    collapseWhitespace: boolean;
    removeEmptyGroups: boolean;
    removeDefaultAttrs: boolean;
  },
): OptimizeResult {
  const removals: string[] = [];

  let svg = input;

  if (opts.removeComments) {
    const before = svg.length;
    svg = svg.replace(/<!--[\s\S]*?-->/g, "");
    if (svg.length < before) removals.push("XML comments");
  }

  if (opts.removeMetadata) {
    const before = svg.length;
    svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
    svg = svg.replace(/<title[\s\S]*?<\/title>/gi, "");
    svg = svg.replace(/<desc[\s\S]*?<\/desc>/gi, "");
    if (svg.length < before) removals.push("metadata / title / desc");
  }

  if (opts.removeEditorData) {
    const before = svg.length;
    // Inkscape namespaces / attributes
    svg = svg.replace(/\s+(inkscape|sodipodi|dc|cc|rdf):[^\s>]+=["'][^"']*["']/g, "");
    // xmlns declarations for editor namespaces
    svg = svg.replace(/\s+xmlns:(inkscape|sodipodi|dc|cc|rdf)="[^"]*"/g, "");
    // Entire sodipodi / inkscape elements
    svg = svg.replace(/<sodipodi:[^/]*\/>/g, "");
    svg = svg.replace(/<inkscape:[^/]*\/>/g, "");
    if (svg.length < before) removals.push("Inkscape / Sodipodi editor data");
  }

  if (opts.removeHiddenElements) {
    const before = svg.length;
    svg = svg.replace(/<[^>]+display:\s*none[^>]*\/>/g, "");
    svg = svg.replace(/<[^>]+visibility:\s*hidden[^>]*\/>/g, "");
    if (svg.length < before) removals.push("hidden elements (display:none)");
  }

  if (opts.removeEmptyGroups) {
    const before = svg.length;
    // Iteratively remove empty <g> tags
    let prev = "";
    while (prev !== svg) {
      prev = svg;
      svg = svg.replace(/<g[^>]*>\s*<\/g>/g, "");
    }
    if (svg.length < before) removals.push("empty <g> groups");
  }

  if (opts.removeDefaultAttrs) {
    const before = svg.length;
    // Remove fill="none" on elements that default to none (path, line, polyline)
    // Remove x="0" y="0" when zero is the default
    svg = svg.replace(/\s+x="0"/g, "");
    svg = svg.replace(/\s+y="0"/g, "");
    svg = svg.replace(/\s+rx="0"/g, "");
    svg = svg.replace(/\s+ry="0"/g, "");
    svg = svg.replace(/\s+stroke-width="1"(?=[\s>])/g, "");
    if (svg.length < before) removals.push("default attribute values");
  }

  if (opts.collapseWhitespace) {
    const before = svg.length;
    // Collapse runs of whitespace between tags
    svg = svg.replace(/>\s{2,}</g, "><");
    // Trim leading/trailing whitespace from attribute values
    svg = svg.replace(/="[\s]+/g, '="');
    svg = svg.replace(/[\s]+"(?=[\s/>])/g, '"');
    // Remove blank lines
    svg = svg.replace(/\n\s*\n/g, "\n");
    svg = svg.trim();
    if (svg.length < before) removals.push("excess whitespace");
  }

  return {
    output: svg,
    originalSize: new TextEncoder().encode(input).length,
    optimizedSize: new TextEncoder().encode(svg).length,
    removals,
  };
}

const DEFAULT_OPTS = {
  removeComments: true,
  removeMetadata: true,
  removeEditorData: true,
  removeHiddenElements: true,
  collapseWhitespace: true,
  removeEmptyGroups: true,
  removeDefaultAttrs: true,
};

const OPT_LABELS: Record<keyof typeof DEFAULT_OPTS, string> = {
  removeComments:       "Remove XML comments",
  removeMetadata:       "Remove <metadata>, <title>, <desc>",
  removeEditorData:     "Strip Inkscape / Illustrator data",
  removeHiddenElements: "Remove display:none elements",
  collapseWhitespace:   "Collapse whitespace",
  removeEmptyGroups:    "Remove empty <g> groups",
  removeDefaultAttrs:   "Remove redundant default attrs",
};

export default function SvgOptimizerTool({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [opts, setOpts] = useState(DEFAULT_OPTS);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"code" | "preview">("code");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result) { setPreviewUrl(null); return; }
    const blob = new Blob([result.output], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const inputRef = (node: HTMLInputElement | null) => { /* file input ref */ };

  function optimize() {
    if (!input.trim()) return;
    setResult(optimizeSvg(input, opts));
  }

  const copy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackToolCopy("svg-optimizer", "output");
    });
  }, [result]);

  function download() {
    if (!result) return;
    const blob = new Blob([result.output], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized.svg";
    a.click();
    URL.revokeObjectURL(url);
    trackToolDownload("svg-optimizer", "svg");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setInput(text);
      setResult(null);
    };
    reader.readAsText(file);
  }

  const savings = result
    ? ((1 - result.optimizedSize / result.originalSize) * 100).toFixed(1)
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Main editor area */}
          <div className="space-y-4">
            {/* Input toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">SVG Input</span>
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Upload .svg
                <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleFileUpload} />
              </label>
              <button
                onClick={optimize}
                disabled={!input.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-40 transition-all ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Optimize
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setResult(null); }}
              placeholder="Paste SVG markup here…"
              spellCheck={false}
              className="w-full h-64 px-4 py-3 rounded-xl border border-border bg-card font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40 scrollbar-thin"
            />

            {/* Result */}
            {result && (
              <div className="space-y-3">
                {/* Stats bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                    Original: {formatBytes(result.originalSize)}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                    Optimized: {formatBytes(result.optimizedSize)}
                  </span>
                  {savings !== null && (
                    <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                      Number(savings) > 0
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {Number(savings) > 0 ? `↓ ${savings}% smaller` : "No size change"}
                    </span>
                  )}
                  {result.removals.length > 0 && (
                    <span className="text-muted-foreground">
                      Removed: {result.removals.join(", ")}
                    </span>
                  )}
                </div>

                {/* Output tabs */}
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <button
                    onClick={() => setView("code")}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${view === "code" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setView("preview")}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${view === "preview" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Preview
                  </button>
                  <div className="ml-auto flex gap-2">
                    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>

                {view === "code" ? (
                  <textarea
                    readOnly
                    value={result.output}
                    className="w-full h-64 px-4 py-3 rounded-xl border border-border bg-muted/30 font-mono text-xs resize-none focus:outline-none scrollbar-thin"
                  />
                ) : (
                  <div className="w-full h-64 rounded-xl border border-border bg-muted/20 flex items-center justify-center overflow-hidden p-4">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="SVG preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options sidebar */}
          <div className="rounded-xl border border-border bg-card p-4 h-fit space-y-3">
            <p className="text-sm font-semibold">Optimizations</p>
            {(Object.keys(opts) as (keyof typeof opts)[]).map((key) => (
              <label key={key} className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={opts[key]}
                  onChange={(e) => setOpts((o) => ({ ...o, [key]: e.target.checked }))}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  {OPT_LABELS[key]}
                </span>
              </label>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
