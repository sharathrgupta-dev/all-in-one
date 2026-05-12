"use client";

import { useCallback, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

const ROTATE_OPTIONS = [
  { label: "90° clockwise", value: 90 as const },
  { label: "180°", value: 180 as const },
  { label: "90° counter-clockwise", value: 270 as const },
];

export default function RotatePdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
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
      const pageIndices = doc.getPageIndices();
      for (const i of pageIndices) {
        const page = doc.getPage(i);
        const cur = page.getRotation().angle;
        page.setRotation(degrees(cur + angle));
      }
      const out = await doc.save();
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      downloadUint8(out, `${name}-rotated.pdf`, "application/pdf", "rotate-pdf");
    } catch {
      setError("Rotation failed.");
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
            <p className="text-sm text-muted-foreground">
              {pages} page{pages === 1 ? "" : "s"} loaded — rotation applies to{" "}
              <strong>every</strong> page (relative to each page&apos;s current rotation).
            </p>
            <div className="flex flex-wrap gap-2">
              {ROTATE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAngle(o.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    angle === o.value
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
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
              Download rotated PDF
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
