"use client";

import { useCallback, useState } from "react";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { Download, Loader2, Upload, FileText } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 50;
const PROSE_SIZE = 11;
const PROSE_LH = PROSE_SIZE * 1.4;
const CODE_SIZE = 9;
const CODE_LH = CODE_SIZE * 1.4;

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

// ─── Helpers ───────────────────────────────────────────────────────────

const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*m/g;

function joinSource(src: string | string[]): string {
  return Array.isArray(src) ? src.join("") : src;
}

function stripAnsi(s: string): string {
  return s.replace(ANSI_ESCAPE_RE, "");
}

function wrap(text: string, measure: (s: string) => number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.length) {
      lines.push("");
      continue;
    }
    const words = para.split(/(\s+)/);
    let current = "";
    for (const word of words) {
      const trial = current + word;
      if (measure(trial) <= maxW) {
        current = trial;
        continue;
      }
      if (current.trim()) {
        lines.push(current.trimEnd());
      }
      // Word itself wider than line: break by character
      if (measure(word) > maxW) {
        let acc = "";
        for (const ch of word) {
          if (measure(acc + ch) <= maxW) acc += ch;
          else {
            if (acc) lines.push(acc);
            acc = ch;
          }
        }
        current = acc;
      } else {
        current = word.trimStart();
      }
    }
    if (current.trim()) lines.push(current.trimEnd());
  }
  return lines;
}

// Decode base64 string (utf8-safe is not needed here — outputs are binary)
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ─── PDF builder ───────────────────────────────────────────────────────

interface BuildContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  prose: PDFFont;
  proseBold: PDFFont;
  mono: PDFFont;
  maxW: number;
}

function newPage(ctx: BuildContext): void {
  ctx.page = ctx.doc.addPage([A4_W, A4_H]);
  ctx.y = A4_H - MARGIN;
}

function ensureSpace(ctx: BuildContext, needed: number): void {
  if (ctx.y - needed < MARGIN) newPage(ctx);
}

function drawProseLine(ctx: BuildContext, line: string, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}): void {
  const font = opts.font ?? ctx.prose;
  const size = opts.size ?? PROSE_SIZE;
  const color = opts.color ?? rgb(0.1, 0.1, 0.1);
  ensureSpace(ctx, size * 1.4);
  ctx.page.drawText(line, { x: MARGIN, y: ctx.y - size, size, font, color });
  ctx.y -= size * 1.4;
}

// Render a markdown source as a sequence of "blocks": heading / paragraph / code-fence
function renderMarkdown(ctx: BuildContext, source: string): void {
  const lines = source.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Fenced code block ```lang ... ```
    if (/^```/.test(line.trim())) {
      const fenceLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        fenceLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      drawCodeBlock(ctx, fenceLines.join("\n"));
      continue;
    }
    // Heading
    const head = /^(#{1,6})\s+(.*)$/.exec(line);
    if (head) {
      const level = head[1].length;
      const text = head[2];
      const size = Math.max(13, 22 - level * 2);
      ctx.y -= size * 0.4;
      drawProseLine(ctx, text, { font: ctx.proseBold, size });
      ctx.y -= size * 0.2;
      i++;
      continue;
    }
    // Blank line
    if (!line.trim()) {
      ctx.y -= PROSE_LH * 0.5;
      i++;
      continue;
    }
    // Bullet
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      const wrapped = wrap("• " + bullet[1], (s) => ctx.prose.widthOfTextAtSize(s, PROSE_SIZE), ctx.maxW - 8);
      for (const w of wrapped) drawProseLine(ctx, w);
      i++;
      continue;
    }
    // Plain paragraph — collect until blank line
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^```|^#{1,6}\s|^\s*[-*]\s/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    const para = paraLines.join(" ").replace(/\s+/g, " ");
    const wrapped = wrap(para, (s) => ctx.prose.widthOfTextAtSize(s, PROSE_SIZE), ctx.maxW);
    for (const w of wrapped) drawProseLine(ctx, w);
    ctx.y -= PROSE_LH * 0.2;
  }
}

function drawCodeBlock(ctx: BuildContext, code: string, opts: { tint?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb> } = {}): void {
  const tint = opts.tint ?? rgb(0.96, 0.97, 0.99);
  const border = opts.border ?? rgb(0.85, 0.87, 0.92);
  const lines = code.split("\n");
  const wrapped: string[] = [];
  for (const ln of lines) {
    const w = wrap(ln || " ", (s) => ctx.mono.widthOfTextAtSize(s, CODE_SIZE), ctx.maxW - 16);
    for (const x of w) wrapped.push(x);
  }
  const blockH = wrapped.length * CODE_LH + 12;
  ensureSpace(ctx, blockH);
  // Background
  ctx.page.drawRectangle({
    x: MARGIN - 4,
    y: ctx.y - blockH + 2,
    width: ctx.maxW + 8,
    height: blockH,
    color: tint,
    borderColor: border,
    borderWidth: 0.5,
  });
  ctx.y -= 6;
  for (const ln of wrapped) {
    ensureSpace(ctx, CODE_LH);
    ctx.page.drawText(ln, {
      x: MARGIN + 4,
      y: ctx.y - CODE_SIZE,
      size: CODE_SIZE,
      font: ctx.mono,
      color: rgb(0.1, 0.1, 0.15),
    });
    ctx.y -= CODE_LH;
  }
  ctx.y -= 6;
}

async function renderImage(ctx: BuildContext, b64: string): Promise<void> {
  try {
    const bytes = base64ToBytes(b64);
    const img = await ctx.doc.embedPng(bytes);
    const scale = Math.min(ctx.maxW / img.width, 1);
    const w = img.width * scale;
    const h = img.height * scale;
    ensureSpace(ctx, h + 8);
    ctx.page.drawImage(img, {
      x: MARGIN,
      y: ctx.y - h,
      width: w,
      height: h,
    });
    ctx.y -= h + 8;
  } catch {
    // Ignore: not a PNG, or corrupted base64.
    drawProseLine(ctx, "[image output omitted — unsupported format]", {
      color: rgb(0.55, 0.55, 0.6),
    });
  }
}

async function renderOutputs(ctx: BuildContext, outputs: NbOutput[]): Promise<void> {
  for (const out of outputs) {
    if (out.output_type === "stream") {
      drawCodeBlock(ctx, stripAnsi(joinSource(out.text ?? "")), {
        tint: rgb(0.98, 0.98, 0.98),
        border: rgb(0.88, 0.88, 0.9),
      });
    } else if (out.output_type === "execute_result" || out.output_type === "display_data") {
      const data = out.data ?? {};
      if (data["image/png"]) {
        await renderImage(ctx, joinSource(data["image/png"]));
      } else if (data["text/plain"]) {
        drawCodeBlock(ctx, stripAnsi(joinSource(data["text/plain"])), {
          tint: rgb(0.98, 0.98, 0.98),
          border: rgb(0.88, 0.88, 0.9),
        });
      }
    } else if (out.output_type === "error") {
      const tb = (out.traceback ?? []).map(stripAnsi).join("\n");
      drawCodeBlock(ctx, tb || `${out.ename}: ${out.evalue}`, {
        tint: rgb(0.99, 0.94, 0.94),
        border: rgb(0.95, 0.6, 0.6),
      });
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────

export default function IpynbToPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [includeOutputs, setIncludeOutputs] = useState(true);
  const [includeCodeCells, setIncludeCodeCells] = useState(true);

  const onFile = useCallback((f: File | null) => {
    setError("");
    setFile(f);
    if (f && !f.name.toLowerCase().endsWith(".ipynb")) {
      setError("Please pick a .ipynb (Jupyter notebook) file.");
    }
  }, []);

  const build = useCallback(async () => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const text = await file.text();
      let nb: Notebook;
      try {
        nb = JSON.parse(text) as Notebook;
      } catch {
        throw new Error("That file is not valid JSON — was it actually a .ipynb?");
      }
      if (!Array.isArray(nb.cells)) {
        throw new Error("Notebook has no `cells` array.");
      }

      const doc = await PDFDocument.create();
      const prose = await doc.embedFont(StandardFonts.Helvetica);
      const proseBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const mono = await doc.embedFont(StandardFonts.Courier);
      const page = doc.addPage([A4_W, A4_H]);
      const ctx: BuildContext = {
        doc,
        page,
        y: A4_H - MARGIN,
        prose,
        proseBold,
        mono,
        maxW: A4_W - 2 * MARGIN,
      };

      // Title
      const title = file.name.replace(/\.ipynb$/i, "");
      drawProseLine(ctx, title, { font: proseBold, size: 18 });
      const kernel = nb.metadata?.kernelspec?.display_name;
      if (kernel) {
        drawProseLine(ctx, `Kernel: ${kernel}`, { size: 9, color: rgb(0.5, 0.5, 0.55) });
      }
      ctx.y -= 12;

      let cellIdx = 0;
      for (const cell of nb.cells) {
        cellIdx++;
        const src = joinSource(cell.source);

        if (cell.cell_type === "markdown") {
          renderMarkdown(ctx, src);
        } else if (cell.cell_type === "code") {
          if (!includeCodeCells) continue;
          // "In [n]:" label
          const inLabel = cell.execution_count != null ? `In [${cell.execution_count}]:` : `In [ ]:`;
          drawProseLine(ctx, inLabel, {
            size: 9,
            color: rgb(0.4, 0.45, 0.6),
          });
          drawCodeBlock(ctx, src);
          if (includeOutputs && cell.outputs && cell.outputs.length > 0) {
            await renderOutputs(ctx, cell.outputs);
          }
        } else if (cell.cell_type === "raw") {
          drawCodeBlock(ctx, src, { tint: rgb(0.99, 0.99, 0.96), border: rgb(0.92, 0.9, 0.8) });
        }
        ctx.y -= 6;
      }

      // Footer note
      drawProseLine(ctx, `${cellIdx} cells · rendered by DevBench`, {
        size: 8,
        color: rgb(0.55, 0.55, 0.6),
      });

      const bytes = await doc.save();
      downloadUint8(bytes, `${title}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build PDF.");
    } finally {
      setBusy(false);
    }
  }, [file, includeOutputs, includeCodeCells]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Upload a Jupyter <code className="font-mono text-xs">.ipynb</code> notebook and download a printable PDF.
          Markdown cells, code cells, text output, and PNG image outputs are preserved. Runs entirely in
          your browser — your notebook is never uploaded.
        </p>

        {/* File picker */}
        <label
          htmlFor="ipynb-file"
          className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:bg-muted"
        >
          {file ? (
            <>
              <FileText aria-hidden="true" className="h-5 w-5 text-accent" />
              <span className="font-medium text-foreground">{file.name}</span>
              <span className="text-xs">{(file.size / 1024).toFixed(1)} KB</span>
            </>
          ) : (
            <>
              <Upload aria-hidden="true" className="h-5 w-5" />
              <span>Click to select a .ipynb file</span>
            </>
          )}
        </label>
        <input
          id="ipynb-file"
          type="file"
          accept=".ipynb,application/json"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {/* Options */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={includeCodeCells}
              onChange={(e) => setIncludeCodeCells(e.target.checked)}
              className="h-4 w-4"
            />
            Include code cells
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={includeOutputs}
              onChange={(e) => setIncludeOutputs(e.target.checked)}
              className="h-4 w-4"
            />
            Include cell outputs
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void build()}
            disabled={busy || !file}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            {busy ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "Building PDF…" : "Download PDF"}
          </button>
          {file && (
            <button
              type="button"
              onClick={() => onFile(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <details className="rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground/80">What gets rendered?</summary>
          <ul className="mt-2 space-y-1">
            <li>✓ <strong>Markdown cells</strong>: headings (H1–H6), paragraphs, bullet lists, fenced code blocks</li>
            <li>✓ <strong>Code cells</strong>: source with execution count, monospaced with light background</li>
            <li>✓ <strong>Stream output</strong> (stdout/stderr) with ANSI escape codes stripped</li>
            <li>✓ <strong>execute_result / display_data</strong>: PNG images, plain text representations</li>
            <li>✓ <strong>Errors</strong>: full traceback with red background</li>
            <li>✗ Inline LaTeX / MathJax (no math rendering — appears as raw source)</li>
            <li>✗ HTML/SVG outputs (kept as plain text where present)</li>
            <li>✗ Interactive widgets (ipywidgets)</li>
          </ul>
        </details>
      </div>
    </main>
  );
}
