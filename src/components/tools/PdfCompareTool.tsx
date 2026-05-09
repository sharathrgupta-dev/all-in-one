"use client";

import { useCallback, useState } from "react";
import { createTwoFilesPatch } from "diff";
import { FileUp, GitCompare, Loader2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { getPdfJsModule } from "@/lib/pdfjs-app";

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  const pdfjs = await getPdfJsModule();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    let chunk = "";
    for (const item of tc.items) {
      if (item && typeof item === "object" && "str" in item) {
        chunk += (item as { str: string }).str;
      }
    }
    parts.push(`--- Page ${p} ---\n${chunk}\n`);
  }
  return parts.join("\n");
}

export default function PdfCompareTool({ tool }: { tool: Tool }) {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [out, setOut] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    (which: "a" | "b", f: File | null) => {
      setError("");
      setOut("");
      if (!f) {
        if (which === "a") setA(null);
        else setB(null);
        return;
      }
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setError("PDF files only.");
        return;
      }
      if (which === "a") setA(f);
      else setB(f);
    },
    []
  );

  const compare = async () => {
    if (!a || !b) {
      setError("Choose two PDF files.");
      return;
    }
    setError("");
    setBusy(true);
    setOut("");
    try {
      const [ta, tb] = await Promise.all([
        extractPdfText(await a.arrayBuffer()),
        extractPdfText(await b.arrayBuffer()),
      ]);
      const patch = createTwoFilesPatch(
        a.name || "A.pdf",
        b.name || "B.pdf",
        ta,
        tb,
        "",
        ""
      );
      setOut(patch.slice(0, 500_000));
    } catch {
      setError("Could not extract or compare text — try non-scanned PDFs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Compares <strong>extracted text</strong> from two PDFs (works best with digital
          PDFs, not scanned images). For scanned documents use OCR elsewhere first.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              PDF A
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <FileUp className="h-4 w-4" />
              {a ? a.name : "Choose file"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={busy}
                onChange={(e) => load("a", e.target.files?.[0] ?? null)}
              />
            </label>
            {a && (
              <button
                type="button"
                className="mt-2 text-xs text-destructive hover:underline"
                onClick={() => load("a", null)}
              >
                Remove
              </button>
            )}
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              PDF B
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <FileUp className="h-4 w-4" />
              {b ? b.name : "Choose file"}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={busy}
                onChange={(e) => load("b", e.target.files?.[0] ?? null)}
              />
            </label>
            {b && (
              <button
                type="button"
                className="mt-2 text-xs text-destructive hover:underline"
                onClick={() => load("b", null)}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void compare()}
          disabled={busy || !a || !b}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitCompare className="h-4 w-4" />
          )}
          {busy ? "Comparing…" : "Compare extracted text"}
        </button>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {out && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Unified diff (from extracted text)
            </p>
            <pre className="max-h-[min(480px,50vh)] overflow-auto rounded-xl border border-border bg-muted/40 p-4 text-xs font-mono whitespace-pre-wrap">
              {out}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
