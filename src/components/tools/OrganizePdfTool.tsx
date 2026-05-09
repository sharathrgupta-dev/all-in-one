"use client";

import { useCallback, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ChevronDown, ChevronUp, Download, FileUp, Loader2, Trash2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

/** order[i] = original page index at output position i */
function reorderOrder(order: number[], idx: number, dir: -1 | 1): number[] {
  const j = idx + dir;
  if (j < 0 || j >= order.length) return order;
  const copy = [...order];
  [copy[idx], copy[j]] = [copy[j], copy[idx]];
  return copy;
}

export default function OrganizePdfTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (f: File | null) => {
    setError("");
    setFile(null);
    setOrder([]);
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
      setOrder(Array.from({ length: n }, (_, i) => i));
    } catch {
      setError("Could not read this PDF.");
    }
  }, []);

  const exportPdf = async () => {
    if (!file || order.length < 1) return;
    setError("");
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf.slice(0));
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, order);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const name = file.name.replace(/\.pdf$/i, "") || "document";
      downloadUint8(bytes, `${name}-organized.pdf`);
    } catch {
      setError("Could not reorganize this PDF.");
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

        {order.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              Move rows to change page order in the new file.
            </p>
            <ul className="space-y-2">
              {order.map((origIdx, pos) => (
                <li
                  key={`${origIdx}-${pos}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <span className="text-xs font-mono text-muted-foreground">
                    Out #{pos + 1}
                  </span>
                  <span className="flex-1 text-sm">
                    Original page <strong>{origIdx + 1}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={busy || pos === 0}
                    onClick={() =>
                      setOrder((o) => reorderOrder(o, pos, -1))
                    }
                    className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || pos === order.length - 1}
                    onClick={() =>
                      setOrder((o) => reorderOrder(o, pos, 1))
                    }
                    className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void exportPdf()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download organized PDF
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
