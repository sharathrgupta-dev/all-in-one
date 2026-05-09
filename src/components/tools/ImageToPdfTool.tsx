"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileImage,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 36;

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

type Row = { id: string; file: File; preview: string };

async function toEmbeddable(
  file: File
): Promise<{ bytes: Uint8Array; kind: "png" | "jpg" }> {
  const t = file.type.toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg") {
    return {
      bytes: new Uint8Array(await file.arrayBuffer()),
      kind: "jpg",
    };
  }
  if (t === "image/png") {
    return {
      bytes: new Uint8Array(await file.arrayBuffer()),
      kind: "png",
    };
  }

  const bmp = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    let { width, height } = bmp;
    const maxDim = 4096;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.drawImage(bmp, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Could not rasterize image"));
      }, "image/png");
    });
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      kind: "png",
    };
  } finally {
    bmp.close();
  }
}

export default function ImageToPdfTool({ tool }: { tool: Tool }) {
  const inputId = useId();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const revokePreview = useCallback((url: string) => {
    URL.revokeObjectURL(url);
  }, []);

  const clearAll = useCallback(() => {
    setRows((prev) => {
      prev.forEach((r) => revokePreview(r.preview));
      return [];
    });
    setError("");
  }, [revokePreview]);

  const pushFiles = useCallback(
    (list: FileList | File[]) => {
      setError("");
      const files = Array.from(list).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) {
        setError("Choose image files (PNG, JPEG, WebP, GIF, etc.).");
        return;
      }
      const next: Row[] = [];
      for (const file of files) {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
        next.push({
          id,
          file,
          preview: URL.createObjectURL(file),
        });
      }
      setRows((prev) => [...prev, ...next]);
    },
    []
  );

  const removeAt = (idx: number) => {
    setRows((prev) => {
      const row = prev[idx];
      if (!row) return prev;
      revokePreview(row.preview);
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    setRows((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });
  };

  const buildPdf = async () => {
    if (rows.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const pdf = await PDFDocument.create();
      const innerW = A4_W - MARGIN * 2;
      const innerH = A4_H - MARGIN * 2;

      for (const row of rows) {
        const { bytes, kind } = await toEmbeddable(row.file);
        const embedded =
          kind === "jpg"
            ? await pdf.embedJpg(bytes)
            : await pdf.embedPng(bytes);

        const page = pdf.addPage([A4_W, A4_H]);
        const scaled = embedded.scaleToFit(innerW, innerH);
        const x = MARGIN + (innerW - scaled.width) / 2;
        const y = MARGIN + (innerH - scaled.height) / 2;
        page.drawImage(embedded, {
          x,
          y,
          width: scaled.width,
          height: scaled.height,
        });
      }

      const out = await pdf.save();
      downloadUint8(out, "images.pdf");
    } catch {
      setError(
        "Could not build PDF — try PNG/JPEG, or smaller images (very large files may fail in-browser)."
      );
    } finally {
      setBusy(false);
    }
  };

  const totalMb = useMemo(
    () =>
      rows.reduce((s, r) => s + r.file.size, 0) / (1024 * 1024),
    [rows]
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            pushFiles(e.dataTransfer.files);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-accent/50 hover:bg-muted/50"
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop images here or click to browse
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            PNG, JPEG, WebP, GIF, BMP — order becomes page order. Runs entirely in
            your browser.
          </p>
          <input
            id={inputId}
            type="file"
            accept="image/*"
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{rows.length}</span>
                {" "}page{rows.length === 1 ? "" : "s"} ·{" "}
                {totalMb < 0.01 ? "<0.01" : totalMb.toFixed(2)} MB total
              </p>
              <button
                type="button"
                onClick={clearAll}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            </div>

            <ul className="space-y-2">
              {rows.map((row, idx) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.preview}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(row.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={busy || idx === 0}
                      onClick={() => move(idx, -1)}
                      className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={busy || idx === rows.length - 1}
                      onClick={() => move(idx, 1)}
                      className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      disabled={busy}
                      onClick={() => removeAt(idx)}
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void buildPdf()}
              disabled={busy || rows.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40 sm:w-auto"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </button>
          </>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <FileImage className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Each image becomes one A4 page; images are scaled to fit with margins.
          Heavy images are downscaled to 4096px max edge before embedding.
        </p>
      </div>
    </main>
  );
}
