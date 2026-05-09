"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadBlob } from "@/lib/pdf-download";

export default function SplitPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (f: File | null) => {
    setError("");
    setFile(null);
    setPageCount(0);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file.");
      return;
    }
    try {
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      const n = doc.getPageCount();
      if (n < 1) {
        setError("This PDF has no pages.");
        return;
      }
      setFile(f);
      setPageCount(n);
    } catch {
      setError("Could not read this PDF.");
    }
  }, []);

  const splitZip = async () => {
    if (!file || pageCount < 1) return;
    setError("");
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf.slice(0));
      const zip = new JSZip();
      const base = file.name.replace(/\.pdf$/i, "") || "pages";

      for (let i = 0; i < pageCount; i++) {
        const out = await PDFDocument.create();
        const [copied] = await out.copyPages(src, [i]);
        out.addPage(copied);
        const bytes = await out.save();
        zip.file(`${base}-page-${i + 1}.pdf`, bytes);
      }

      const zipped = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipped, `${base}-split.zip`);
    } catch {
      setError("Split failed — file may be encrypted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap gap-3">
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
          {file && (
            <button
              type="button"
              onClick={() => void onFile(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {pageCount > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{pageCount}</span>{" "}
              page{pageCount === 1 ? "" : "s"} — download one PDF per page inside a ZIP.
            </p>
            <button
              type="button"
              onClick={() => void splitZip()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Split into ZIP
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
