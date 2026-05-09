"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

export default function CompressPdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [beforeBytes, setBeforeBytes] = useState(0);
  const [afterBytes, setAfterBytes] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (f: File | null) => {
    setError("");
    setFile(null);
    setBeforeBytes(0);
    setAfterBytes(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file.");
      return;
    }
    setFile(f);
    setBeforeBytes(f.size);
  }, []);

  const compress = async () => {
    if (!file) return;
    setError("");
    setBusy(true);
    setAfterBytes(null);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      const saved = await doc.save({ useObjectStreams: true });
      setAfterBytes(saved.byteLength);
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      downloadUint8(saved, `${name}-optimized.pdf`);
    } catch {
      setError("Optimization failed — PDF may be encrypted.");
    } finally {
      setBusy(false);
    }
  };

  const ratio =
    beforeBytes > 0 && afterBytes !== null
      ? Math.round((1 - afterBytes / beforeBytes) * 100)
      : null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Re-saves your PDF with object streams enabled. Savings vary; scanned PDFs or
          images inside pages rarely shrink much without heavier server-side compression.
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

        {file && (
          <>
            <p className="text-sm text-muted-foreground">
              Original size: {(beforeBytes / 1024).toFixed(1)} KB
              {ratio !== null && (
                <>
                  {" "}
                  → Optimized: {(afterBytes! / 1024).toFixed(1)} KB
                  <span className="text-foreground">
                    {" "}
                    ({ratio >= 0 ? "−" : "+"}
                    {Math.abs(ratio)}%)
                  </span>
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => void compress()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download optimized PDF
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
