"use client";

import { useCallback, useState } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

export default function WatermarkPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.18);
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
    if (!file || pages < 1 || !text.trim()) return;
    setError("");
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const size = 42;
      const t = text.trim();

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(t, size);
        page.drawText(t, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - size / 2,
          size,
          font,
          color: rgb(0.55, 0.55, 0.55),
          opacity,
          rotate: degrees(-35),
        });
      }

      const out = await doc.save();
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      downloadUint8(out, `${name}-watermarked.pdf`, "application/pdf", "watermark-pdf");
    } catch {
      setError("Watermark failed.");
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
            <div className="space-y-3">
              <label className="block text-sm font-medium">Watermark text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full max-w-md rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
                placeholder="Watermark"
              />
              <label className="flex flex-wrap items-center gap-3 text-sm">
                Opacity
                <input
                  type="range"
                  min={0.08}
                  max={0.45}
                  step={0.01}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="max-w-xs flex-1"
                />
                <span className="text-muted-foreground">{opacity.toFixed(2)}</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download watermarked PDF
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
