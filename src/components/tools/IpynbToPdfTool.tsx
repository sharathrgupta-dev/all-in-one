"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Copy,
  Printer,
  RotateCcw,
  Eye,
  Code2,
  Check,
  Sparkles,
} from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

// ─── Notebook types ────────────────────────────────────────────────────

interface NbCell {
  cell_type: "markdown" | "code" | "raw";
  source: string | string[];
  execution_count?: number | null;
  outputs?: NbOutput[];
}

interface NbOutput {
  output_type: "stream" | "execute_result" | "display_data" | "error";
  name?: string;
  text?: string | string[];
  data?: Record<string, string | string[]>;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface Notebook {
  cells: NbCell[];
  metadata?: { kernelspec?: { display_name?: string; name?: string } };
}

// ─── Utilities ─────────────────────────────────────────────────────────

const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*m/g;

function joinSource(src: string | string[]): string {
  return Array.isArray(src) ? src.join("") : src;
}

function stripAnsi(s: string): string {
  return s.replace(ANSI_ESCAPE_RE, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Lightweight markdown → HTML ───────────────────────────────────────

function inlineMarkdown(s: string): string {
  let html = escapeHtml(s);
  // Inline code (must come before bold/italic so we don't process inside)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\b__([^_\n]+?)__\b/g, "<strong>$1</strong>");
  // Italic (*text* or _text_)
  html = html.replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
  html = html.replace(/(^|[\s(])_([^_\n]+?)_(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
  // Images ![alt](url) — must come before links
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  return html;
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    if (!buf.length) return;
    const text = buf.join(" ").trim();
    if (text) out.push(`<p>${inlineMarkdown(text)}</p>`);
    buf.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const lang = fence[1] || "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      out.push(
        `<pre class="md-code${lang ? ` lang-${escapeHtml(lang)}` : ""}"><code>${escapeHtml(
          codeLines.join("\n")
        )}</code></pre>`
      );
      continue;
    }

    // Heading
    const head = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (head) {
      const lvl = head[1].length;
      out.push(`<h${lvl}>${inlineMarkdown(head[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s*[-*+]\s+/, "");
        items.push(`<li>${inlineMarkdown(item)}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s*\d+\.\s+/, "");
        items.push(`<li>${inlineMarkdown(item)}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const qLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        qLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inlineMarkdown(qLines.join(" "))}</blockquote>`);
      continue;
    }

    // Blank line → paragraph break
    if (!line.trim()) {
      i++;
      continue;
    }

    // Plain paragraph — collect contiguous lines until blank or block element
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+|^```|^\s*[-*+]\s+|^\s*\d+\.\s+|^>\s?/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    flushParagraph(paraLines);
  }

  return out.join("\n");
}

// ─── Sanitise raw HTML outputs from the notebook ───────────────────────

function sanitizeNotebookHtml(html: string): string {
  // Remove scripts and Colab-specific UI scaffolding before we trust the rest.
  // <style scoped> blocks are kept — they style pandas tables nicely.
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<div class="colab-df-buttons"[\s\S]*?<\/div>/g, "")
    .replace(/<button class="colab-df-[\s\S]*?<\/button>/g, "")
    .replace(/<div class="colab-df-[^"]*"[\s\S]*?<\/div>/g, "")
    .replace(/\son[a-z]+="[^"]*"/gi, ""); // inline event handlers
}

// ─── Cell → HTML ────────────────────────────────────────────────────────

interface RenderOptions {
  includeCodeCells: boolean;
  includeOutputs: boolean;
}

function renderOutputHtml(out: NbOutput): string {
  if (out.output_type === "stream") {
    const text = stripAnsi(joinSource(out.text ?? ""));
    const cls = out.name === "stderr" ? "out-stream out-stderr" : "out-stream";
    return `<pre class="${cls}">${escapeHtml(text)}</pre>`;
  }
  if (out.output_type === "execute_result" || out.output_type === "display_data") {
    const data = out.data ?? {};
    // Priority: HTML (best fidelity) → PNG → plain text
    if (data["text/html"]) {
      const html = joinSource(data["text/html"]);
      return `<div class="out-html">${sanitizeNotebookHtml(html)}</div>`;
    }
    if (data["image/png"]) {
      const b64 = joinSource(data["image/png"]).replace(/\s+/g, "");
      return `<div class="out-image"><img alt="Cell output" src="data:image/png;base64,${b64}" /></div>`;
    }
    if (data["image/jpeg"]) {
      const b64 = joinSource(data["image/jpeg"]).replace(/\s+/g, "");
      return `<div class="out-image"><img alt="Cell output" src="data:image/jpeg;base64,${b64}" /></div>`;
    }
    if (data["image/svg+xml"]) {
      const svg = joinSource(data["image/svg+xml"]);
      return `<div class="out-image">${sanitizeNotebookHtml(svg)}</div>`;
    }
    if (data["text/plain"]) {
      return `<pre class="out-text">${escapeHtml(stripAnsi(joinSource(data["text/plain"])))}</pre>`;
    }
  }
  if (out.output_type === "error") {
    const tb = (out.traceback ?? []).map(stripAnsi).join("\n");
    const fallback = `${out.ename ?? "Error"}: ${out.evalue ?? ""}`.trim();
    return `<pre class="out-error">${escapeHtml(tb || fallback)}</pre>`;
  }
  return "";
}

function renderCellHtml(cell: NbCell, opts: RenderOptions): string {
  const src = joinSource(cell.source);

  if (cell.cell_type === "markdown") {
    return `<div class="cell markdown-cell">${markdownToHtml(src)}</div>`;
  }

  if (cell.cell_type === "raw") {
    return `<div class="cell raw-cell"><pre>${escapeHtml(src)}</pre></div>`;
  }

  // code cell
  if (!opts.includeCodeCells) return "";

  const execLabel = cell.execution_count != null ? `In&nbsp;[${cell.execution_count}]:` : "In&nbsp;[&nbsp;]:";
  const sourceHtml = `<pre class="code-source"><code>${escapeHtml(src)}</code></pre>`;

  let outputsHtml = "";
  if (opts.includeOutputs && cell.outputs && cell.outputs.length > 0) {
    outputsHtml = cell.outputs.map(renderOutputHtml).join("\n");
  }

  return `<div class="cell code-cell">
    <div class="cell-body">
      <div class="cell-label cell-label-in">${execLabel}</div>
      <div class="cell-content">${sourceHtml}</div>
    </div>
    ${outputsHtml ? `<div class="cell-outputs"><div class="cell-body"><div class="cell-label cell-label-out"></div><div class="cell-content">${outputsHtml}</div></div></div>` : ""}
  </div>`;
}

// ─── Full HTML document ────────────────────────────────────────────────

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .nb-root {
    max-width: 880px;
    margin: 0 auto;
    padding: 32px 40px;
  }
  .nb-title {
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 4px;
    color: #111;
  }
  .nb-kernel {
    font-size: 12px;
    color: #6b7280;
    margin: 0 0 28px;
  }
  /* Cells */
  .cell { margin-bottom: 16px; }
  .cell-body {
    display: grid;
    grid-template-columns: 76px 1fr;
    gap: 8px;
    align-items: start;
  }
  .cell-label {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
    color: #c53030;
    padding-top: 8px;
    text-align: right;
    user-select: none;
    white-space: nowrap;
  }
  .cell-label-out { color: transparent; }
  .cell-content { min-width: 0; }
  /* Code source */
  .code-source {
    background: #f5f7fb;
    border: 1px solid #e5e9f2;
    border-radius: 4px;
    padding: 8px 12px;
    margin: 0;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #1f2937;
    white-space: pre;
  }
  .code-source code {
    font: inherit;
    background: none;
    padding: 0;
  }
  /* Outputs */
  .cell-outputs { margin-top: 6px; }
  .out-stream, .out-text {
    background: #fafbfc;
    border: 1px solid #eceef2;
    border-radius: 4px;
    padding: 6px 12px;
    margin: 0 0 6px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.55;
    color: #2d3748;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
  }
  .out-stderr {
    background: #fff5f5;
    border-color: #fed7d7;
    color: #c53030;
  }
  .out-error {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 4px;
    padding: 8px 12px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
    color: #9b2c2c;
    white-space: pre-wrap;
    margin: 0 0 6px;
  }
  .out-image {
    margin: 4px 0 10px;
    text-align: left;
  }
  .out-image img, .out-image svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
  .out-html {
    margin: 4px 0 10px;
    overflow-x: auto;
  }
  /* Tables (pandas DataFrames bring their own scoped <style>, but provide a baseline) */
  .out-html table, .markdown-cell table {
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 12px;
  }
  .out-html th, .out-html td,
  .markdown-cell th, .markdown-cell td {
    border: 1px solid #dfe3eb;
    padding: 4px 10px;
    text-align: left;
  }
  .out-html thead th {
    background: #f4f6fa;
    font-weight: 600;
  }
  /* Markdown */
  .markdown-cell h1, .markdown-cell h2, .markdown-cell h3,
  .markdown-cell h4, .markdown-cell h5, .markdown-cell h6 {
    color: #111;
    margin: 18px 0 8px;
    line-height: 1.3;
    font-weight: 600;
  }
  .markdown-cell h1 { font-size: 22px; }
  .markdown-cell h2 { font-size: 19px; }
  .markdown-cell h3 { font-size: 16px; }
  .markdown-cell h4 { font-size: 14px; }
  .markdown-cell p { margin: 6px 0; }
  .markdown-cell ul, .markdown-cell ol { padding-left: 22px; margin: 6px 0; }
  .markdown-cell li { margin: 2px 0; }
  .markdown-cell code {
    background: #f5f7fb;
    border: 1px solid #e5e9f2;
    border-radius: 3px;
    padding: 1px 5px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.9em;
  }
  .markdown-cell pre.md-code {
    background: #f5f7fb;
    border: 1px solid #e5e9f2;
    border-radius: 4px;
    padding: 10px 14px;
    overflow-x: auto;
    margin: 8px 0;
    font-size: 13px;
  }
  .markdown-cell pre.md-code code {
    background: none;
    border: 0;
    padding: 0;
  }
  .markdown-cell a { color: #4f46e5; text-decoration: underline; }
  .markdown-cell blockquote {
    border-left: 3px solid #e5e9f2;
    padding-left: 12px;
    color: #4b5563;
    margin: 8px 0;
  }
  .markdown-cell img { max-width: 100%; height: auto; }
  /* Footer */
  .nb-footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #e5e9f2;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }
  /* Print rules — clean output for Save-as-PDF */
  @media print {
    body { font-size: 11px; }
    .nb-root { max-width: 100%; padding: 0; }
    .cell { break-inside: avoid; }
    .out-image, .out-html { break-inside: avoid; }
    .nb-footer { break-before: avoid; }
    @page { margin: 14mm 12mm; }
  }
`;

function notebookToHtml(nb: Notebook, title: string, opts: RenderOptions): string {
  const kernel = nb.metadata?.kernelspec?.display_name ?? nb.metadata?.kernelspec?.name;
  const cellsHtml = nb.cells.map((cell) => renderCellHtml(cell, opts)).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <div class="nb-root">
    <h1 class="nb-title">${escapeHtml(title)}</h1>
    ${kernel ? `<p class="nb-kernel">Kernel: ${escapeHtml(kernel)}</p>` : ""}
    ${cellsHtml}
    <div class="nb-footer">Rendered by DevBench · devbench.co.in/tools/ipynb-to-pdf</div>
  </div>
</body>
</html>`;
}

// ─── Sample notebook (Try Sample button) ───────────────────────────────

const SAMPLE_NOTEBOOK: Notebook = {
  metadata: { kernelspec: { display_name: "Python 3", name: "python3" } },
  cells: [
    {
      cell_type: "markdown",
      source:
        "# Sample notebook\n\nThis demonstrates how DevBench renders Jupyter notebooks. It shows **bold**, *italic*, `inline code`, lists, and code cells with output.",
    },
    {
      cell_type: "markdown",
      source:
        "## Loading data\n\nA quick pandas example. The DataFrame's HTML representation will render as a styled table in the PDF.",
    },
    {
      cell_type: "code",
      execution_count: 1,
      source: "import pandas as pd\n\ndf = pd.DataFrame({\n    'fruit': ['apple', 'banana', 'cherry', 'date'],\n    'weight_g': [180, 120, 8, 7],\n    'colour': ['red', 'yellow', 'red', 'brown'],\n})\ndf",
      outputs: [
        {
          output_type: "execute_result",
          data: {
            "text/html":
              '<div>\n<table border="1" class="dataframe">\n  <thead>\n    <tr style="text-align: right;">\n      <th></th>\n      <th>fruit</th>\n      <th>weight_g</th>\n      <th>colour</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr><th>0</th><td>apple</td><td>180</td><td>red</td></tr>\n    <tr><th>1</th><td>banana</td><td>120</td><td>yellow</td></tr>\n    <tr><th>2</th><td>cherry</td><td>8</td><td>red</td></tr>\n    <tr><th>3</th><td>date</td><td>7</td><td>brown</td></tr>\n  </tbody>\n</table>\n</div>',
            "text/plain":
              "    fruit  weight_g  colour\n0   apple       180     red\n1  banana       120  yellow\n2  cherry         8     red\n3    date         7   brown",
          },
        },
      ],
    },
    {
      cell_type: "code",
      execution_count: 2,
      source: "print(f'Total weight: {df.weight_g.sum()} g')\nprint(f'Heaviest: {df.loc[df.weight_g.idxmax(), \"fruit\"]}')",
      outputs: [
        {
          output_type: "stream",
          name: "stdout",
          text: "Total weight: 315 g\nHeaviest: apple\n",
        },
      ],
    },
    {
      cell_type: "markdown",
      source:
        "### What gets preserved\n\n- Markdown formatting (headings, lists, bold/italic)\n- Code cells with execution counts\n- Stream output (stdout/stderr)\n- HTML tables (pandas DataFrames)\n- PNG/JPEG/SVG images (matplotlib, seaborn)\n- Error tracebacks (with ANSI codes stripped)\n\n> Click **Generate PDF** and pick *Save as PDF* in the print dialog.",
    },
  ],
};

// ─── Component ─────────────────────────────────────────────────────────

export default function IpynbToPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"preview" | "html">("preview");
  const [copied, setCopied] = useState(false);
  const [includeOutputs, setIncludeOutputs] = useState(true);
  const [includeCodeCells, setIncludeCodeCells] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const html = useMemo(() => {
    if (!notebook) return "";
    return notebookToHtml(notebook, docTitle || "Notebook", {
      includeCodeCells,
      includeOutputs,
    });
  }, [notebook, docTitle, includeCodeCells, includeOutputs]);

  const acceptFile = useCallback(async (f: File | null) => {
    setError("");
    if (!f) {
      setFile(null);
      setNotebook(null);
      setDocTitle("");
      return;
    }
    if (!f.name.toLowerCase().endsWith(".ipynb")) {
      setError("That doesn't look like a .ipynb file.");
      return;
    }
    try {
      const text = await f.text();
      const nb = JSON.parse(text) as Notebook;
      if (!Array.isArray(nb.cells)) {
        throw new Error("Notebook has no cells array.");
      }
      setFile(f);
      setNotebook(nb);
      setDocTitle(f.name.replace(/\.ipynb$/i, ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse notebook.");
    }
  }, []);

  const trySample = useCallback(() => {
    setError("");
    setNotebook(SAMPLE_NOTEBOOK);
    setDocTitle("Sample Notebook");
    setFile(null);
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setNotebook(null);
    setDocTitle("");
    setError("");
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const generatePdf = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }, []);

  const copyHtml = useCallback(() => {
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [html]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void acceptFile(f);
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      {/* Upload + Features row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upload */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <FileText aria-hidden="true" className="h-4 w-4 text-accent" />
            Upload IPYNB File
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Drag and drop or click to upload your .ipynb file
          </p>

          <label
            htmlFor="ipynb-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border bg-background hover:border-accent/40 hover:bg-muted/40"
            }`}
          >
            <Upload aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
            {file ? (
              <>
                <span className="text-xs text-muted-foreground">Drop your .ipynb file here or click to browse</span>
                <span className="text-sm font-medium text-foreground">
                  Selected: {file.name}
                </span>
              </>
            ) : notebook ? (
              <>
                <span className="text-xs text-muted-foreground">Drop your .ipynb file here or click to browse</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Using sample notebook
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                Drop your .ipynb file here or click to browse
              </span>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="ipynb-file"
            type="file"
            accept=".ipynb,application/json"
            onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />

          <button
            type="button"
            onClick={trySample}
            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
          >
            Try Sample Notebook
          </button>

          {error && (
            <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </section>

        {/* Options + features */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Options</h3>
          <div className="space-y-2 mb-5">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={includeCodeCells}
                onChange={(e) => setIncludeCodeCells(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Include code cells
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={includeOutputs}
                onChange={(e) => setIncludeOutputs(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Include cell outputs
            </label>
          </div>

          <h3 className="mb-2 text-sm font-semibold">What gets rendered</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>✓ Markdown (headings, lists, bold/italic, links, code)</li>
            <li>✓ Code cells with In&nbsp;[n] labels</li>
            <li>✓ HTML tables (pandas DataFrames) with proper borders</li>
            <li>✓ PNG / JPEG / SVG images (matplotlib, seaborn, plotly static)</li>
            <li>✓ Stream output (stdout/stderr, ANSI stripped)</li>
            <li>✓ Error tracebacks</li>
            <li>✗ LaTeX / MathJax (use <code className="font-mono">nbconvert</code> — see below)</li>
            <li>✗ Interactive widgets (ipywidgets, Plotly interactive)</li>
          </ul>
        </section>
      </div>

      {/* Preview section */}
      {notebook && (
        <section className="mt-6 rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold">PDF Preview</h2>
              <p className="text-xs text-muted-foreground">Your notebook is ready for PDF export</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyHtml}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" className="h-3.5 w-3.5" /> Copy HTML
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={generatePdf}
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
              >
                <Printer aria-hidden="true" className="h-3.5 w-3.5" /> Generate PDF
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="grid grid-cols-2 gap-1 border-b border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye aria-hidden="true" className="h-3.5 w-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={() => setTab("html")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "html"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 aria-hidden="true" className="h-3.5 w-3.5" /> HTML Source
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {tab === "preview" ? (
              <iframe
                ref={iframeRef}
                srcDoc={html}
                title="Notebook preview"
                className="h-[640px] w-full rounded-lg border border-border bg-white"
                sandbox="allow-same-origin allow-modals allow-popups"
              />
            ) : (
              <pre className="max-h-[640px] overflow-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
                <code>{html}</code>
              </pre>
            )}
          </div>

          {/* Info note */}
          <div className="border-t border-border bg-accent/5 px-5 py-3 text-xs text-foreground/80">
            <strong>Note:</strong> Click &quot;Generate PDF&quot; to open your browser&apos;s print dialog. Choose &quot;Save as PDF&quot; as your destination to create the PDF file.
          </div>
        </section>
      )}

      {/* nbconvert CLI fallback */}
      <details className="mt-6 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground/80">
          Need LaTeX math or interactive widgets? Use <code className="font-mono text-[11px]">nbconvert</code>
        </summary>
        <div className="mt-3 space-y-3">
          <p>
            For full-fidelity PDFs with rendered LaTeX equations and matching Jupyter styling, run the
            official <code className="font-mono">nbconvert</code> tool locally.
          </p>
          <div>
            <p className="font-semibold text-foreground/80 mb-1">Install</p>
            <pre className="overflow-x-auto rounded-md bg-muted/50 px-3 py-2 font-mono text-[11px] text-foreground">{`pip install nbconvert
# macOS:    brew install --cask mactex pandoc
# Ubuntu:   sudo apt install texlive-xetex pandoc`}</pre>
          </div>
          <div>
            <p className="font-semibold text-foreground/80 mb-1">Convert</p>
            <pre className="overflow-x-auto rounded-md bg-muted/50 px-3 py-2 font-mono text-[11px] text-foreground">{`jupyter nbconvert --to pdf your_notebook.ipynb

# Or skip the LaTeX dependency — uses Chromium under the hood:
jupyter nbconvert --to webpdf --allow-chromium-download your_notebook.ipynb`}</pre>
          </div>
          <p className="text-[11px]">
            <strong>Kaggle:</strong> download the notebook via File → Download Notebook, then convert locally. (
            <a
              href="https://www.kaggle.com/discussions/getting-started/529313"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              community thread
            </a>
            )
          </p>
        </div>
      </details>
    </main>
  );
}
