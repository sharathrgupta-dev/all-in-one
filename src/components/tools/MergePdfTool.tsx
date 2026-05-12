"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ChevronDown, ChevronUp, Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

type Row = { id: string; file: File };

export default function MergePdfTool({ tool }: { tool: Tool }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pushFiles = useCallback((list: FileList | File[]) => {
    setError("");
    const pdfs = Array.from(list).filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length === 0) {
      setError("Add PDF files only.");
      return;
    }
    const next: Row[] = pdfs.map((file) => ({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      file,
    }));
    setRows((prev) => [...prev, ...next]);
  }, []);

  const removeAt = (idx: number) =>
    setRows((prev) => [...prev.slice(0, idx), ...prev.slice(idx + 1)]);

  const move = (idx: number, dir: -1 | 1) => {
    setRows((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });
  };

  const merge = async () => {
    if (rows.length < 2) {
      setError("Add at least two PDFs to merge.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const merged = await PDFDocument.create();
      for (const row of rows) {
        const buf = await row.file.arrayBuffer();
        const src = await PDFDocument.load(buf.slice(0));
        const indices = src.getPageIndices();
        const copied = await merged.copyPages(src, indices);
        copied.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      downloadUint8(out, "merged.pdf", "application/pdf", "merge-pdf");
    } catch {
      setError("Merge failed — one file may be encrypted or corrupted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center hover:border-accent/50">
          <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Choose PDFs (multiple)</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files;
              if (f?.length) pushFiles(f);
              e.target.value = "";
            }}
          />
        </label>

        {rows.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              Order top → bottom is the order in the merged file.
            </p>
            <ul className="space-y-2">
              {rows.map((row, idx) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-mono">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {row.file.name}
                  </span>
                  <button
                    type="button"
                    disabled={busy || idx === 0}
                    onClick={() => move(idx, -1)}
                    className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || idx === rows.length - 1}
                    onClick={() => move(idx, 1)}
                    className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeAt(idx)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void merge()}
              disabled={busy || rows.length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Merge PDF
            </button>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
