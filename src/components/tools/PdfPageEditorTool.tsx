"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileUp, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

function downloadUint8(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PdfPageEditorTool({ tool }: { tool: Tool }) {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [baseName, setBaseName] = useState("document");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i)));
  };

  const selectNone = () => setSelected(new Set());

  const onFile = useCallback(async (file: File | null) => {
    setError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    try {
      setBusy(true);
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      const n = doc.getPageCount();
      if (n < 1) {
        setError("This PDF has no pages.");
        return;
      }
      setPdfBytes(buf);
      setPageCount(n);
      setSelected(new Set());
      setBaseName(file.name.replace(/\.pdf$/i, "") || "document");
    } catch {
      setError("Could not read this PDF. It may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  }, []);

  const removeSelectedPages = async () => {
    if (!pdfBytes || selected.size === 0) {
      setError("Select at least one page to remove.");
      return;
    }
    setError("");
    try {
      setBusy(true);
      const doc = await PDFDocument.load(pdfBytes.slice(0));
      const count = doc.getPageCount();
      const toRemove = [...selected]
        .filter((i) => i >= 0 && i < count)
        .sort((a, b) => b - a);
      if (toRemove.length >= count) {
        setError("You cannot remove every page.");
        return;
      }
      for (const i of toRemove) doc.removePage(i);
      const out = await doc.save();
      downloadUint8(out, `${baseName}-removed-pages.pdf`);
    } catch {
      setError("Failed to build PDF. Try another file.");
    } finally {
      setBusy(false);
    }
  };

  const extractSelectedPages = async () => {
    if (!pdfBytes || selected.size === 0) {
      setError("Select pages to keep in the new PDF.");
      return;
    }
    setError("");
    try {
      setBusy(true);
      const src = await PDFDocument.load(pdfBytes.slice(0));
      const out = await PDFDocument.create();
      const count = src.getPageCount();
      const indices = [...selected]
        .filter((i) => i >= 0 && i < count)
        .sort((a, b) => a - b);
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadUint8(bytes, `${baseName}-extract.pdf`);
    } catch {
      setError("Failed to extract pages. Try another file.");
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setPdfBytes(null);
    setPageCount(0);
    setSelected(new Set());
    setError("");
  };

  const maxGrid = 60;
  const showGrid = pageCount > 0 && pageCount <= maxGrid;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90">
            <FileUp className="h-4 w-4" />
            Choose PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {pdfBytes && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>

        {pageCount > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{pageCount}</span>{" "}
            page{pageCount === 1 ? "" : "s"} loaded — tick pages, then remove them from the file or
            export only those pages.
          </p>
        )}

        {pageCount > maxGrid && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This PDF has more than {maxGrid} pages. Use a desktop editor for very large documents,
            or split the file first.
          </p>
        )}

        {showGrid && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={selectNone}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Clear selection
            </button>
          </div>
        )}

        {showGrid && (
          <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: pageCount }, (_, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    selected.has(i)
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="rounded"
                  />
                  Page {i + 1}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || selected.size === 0 || !pdfBytes}
            onClick={() => void removeSelectedPages()}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Download PDF (remove selected pages)
          </button>
          <button
            type="button"
            disabled={busy || selected.size === 0 || !pdfBytes}
            onClick={() => void extractSelectedPages()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Download PDF (selected pages only)
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          All processing runs in your browser. Password-protected PDFs are not supported.
        </p>
      </div>
    </main>
  );
}
