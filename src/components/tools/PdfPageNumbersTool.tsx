"use client";

import { useCallback, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

export default function PdfPageNumbersTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [showTotal, setShowTotal] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (f: File | null) => {
    setError("");
    setFile(null);
    setPages(0);
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
      setPages(n);
    } catch {
      setError("Could not read this PDF.");
    }
  }, []);

  const apply = async () => {
    if (!file || pages < 1) return;
    setError("");
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const n = doc.getPageCount();
      const fs = 10;

      for (let i = 0; i < n; i++) {
        const page = doc.getPage(i);
        const { width } = page.getSize();
        const label = showTotal ? `Page ${i + 1} of ${n}` : `${i + 1}`;
        const tw = font.widthOfTextAtSize(label, fs);
        page.drawText(label, {
          x: width / 2 - tw / 2,
          y: 20,
          size: fs,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
      }

      const out = await doc.save();
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      downloadUint8(out, `${name}-page-numbers.pdf`);
    } catch {
      setError("Could not add page numbers.");
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

        {pages > 0 && (
          <>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showTotal}
                onChange={(e) => setShowTotal(e.target.checked)}
                className="rounded border-border"
              />
              Show &quot;Page X of Y&quot; (unchecked = page number only)
            </label>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF with page numbers
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
