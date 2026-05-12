"use client";

import { useCallback, useState } from "react";
import JSZip from "jszip";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadBlob } from "@/lib/pdf-download";
import { getPdfJsModule } from "@/lib/pdfjs-app";

export default function PdfToJpgTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [quality, setQuality] = useState(0.88);
  const [scale, setScale] = useState(2);
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
      const pdfjs = await getPdfJsModule();
      const buf = await f.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const n = pdf.numPages;
      if (n < 1) {
        setError("This PDF has no pages.");
        return;
      }
      setFile(f);
      setPages(n);
    } catch {
      setError("Could not read this PDF in the browser.");
    }
  }, []);

  const run = async () => {
    if (!file || pages < 1) return;
    setError("");
    setBusy(true);
    try {
      const pdfjs = await getPdfJsModule();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
      const zip = new JSZip();
      const base = file.name.replace(/\.pdf$/i, "") || "export";

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unsupported");
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("JPEG export failed"))),
            "image/jpeg",
            quality
          );
        });
        zip.file(`${base}-page-${p}.jpg`, blob);
      }

      const zipped = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipped, `${base}.zip`, "pdf-to-jpg");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Export failed (try a smaller PDF)."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Renders each page to a JPEG and packs them in a ZIP. Heavier PDFs take longer
          in the browser.
        </p>

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
            <p className="text-sm text-muted-foreground">
              {pages} page{pages === 1 ? "" : "s"} detected.
            </p>
            <label className="flex flex-wrap items-center gap-3 text-sm">
              JPEG quality
              <input
                type="range"
                min={0.5}
                max={0.98}
                step={0.02}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="max-w-xs flex-1"
              />
              <span className="text-muted-foreground">{quality.toFixed(2)}</span>
            </label>
            <label className="flex flex-wrap items-center gap-3 text-sm">
              Render scale
              <input
                type="range"
                min={1}
                max={3}
                step={0.25}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="max-w-xs flex-1"
              />
              <span className="text-muted-foreground">{scale}×</span>
            </label>
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download ZIP (JPGs)
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
