"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import { trackToolDownload } from "@/lib/analytics-events";
import ToolPageHero from "@/components/tools/ToolPageHero";

type ImgFmt = "image/png" | "image/jpeg" | "image/webp";

export default function ImageResizerTool({ tool }: { tool: Tool }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [widthIn, setWidthIn] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImgFmt>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastName, setLastName] = useState("image");

  useEffect(() => {
    return () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [srcUrl, previewUrl]);

  const applyDimsFromNatural = useCallback((w: number, h: number) => {
    setNaturalW(w);
    setNaturalH(h);
    setWidthIn(String(w));
    setHeightIn(String(h));
  }, []);

  const onPickFile = useCallback(
    (file: File | null) => {
      setError("");
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (!file || !file.type.startsWith("image/")) {
        setError("Choose an image file (PNG, JPEG, or WebP).");
        return;
      }
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      const url = URL.createObjectURL(file);
      setSrcUrl(url);
      setLastName(file.name.replace(/\.[^.]+$/, "") || "image");
      const img = new Image();
      img.onload = () => {
        applyDimsFromNatural(img.naturalWidth, img.naturalHeight);
      };
      img.onerror = () => setError("Could not read this image.");
      img.src = url;
    },
    [applyDimsFromNatural, srcUrl]
  );

  const ratio = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : 1;

  const updateWidth = (wStr: string) => {
    setWidthIn(wStr);
    if (!lockAspect || !naturalW) return;
    const w = parseInt(wStr, 10);
    if (!Number.isFinite(w) || w <= 0) return;
    const h = Math.max(1, Math.round(w / ratio));
    setHeightIn(String(h));
  };

  const updateHeight = (hStr: string) => {
    setHeightIn(hStr);
    if (!lockAspect || !naturalH) return;
    const h = parseInt(hStr, 10);
    if (!Number.isFinite(h) || h <= 0) return;
    const w = Math.max(1, Math.round(h * ratio));
    setWidthIn(String(w));
  };

  const renderPreview = useCallback(async () => {
    if (!srcUrl) return;
    const w = parseInt(widthIn, 10);
    const h = parseInt(heightIn, 10);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
      setError("Enter positive width and height.");
      return;
    }
    setError("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = srcUrl;
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("load"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Canvas is unavailable.");
      return;
    }
    ctx.drawImage(img, 0, 0, w, h);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not encode image.");
          return;
        }
        const u = URL.createObjectURL(blob);
        setPreviewUrl(u);
      },
      format,
      format === "image/png" ? undefined : quality
    );
  }, [srcUrl, widthIn, heightIn, format, quality]);

  useEffect(() => {
    if (!srcUrl || !widthIn || !heightIn) return;
    const t = setTimeout(() => {
      void renderPreview();
    }, 200);
    return () => clearTimeout(t);
  }, [srcUrl, widthIn, heightIn, format, quality, renderPreview]);

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
    a.href = previewUrl;
    a.download = `${lastName}-resized.${ext}`;
    a.click();
    trackToolDownload("image-resizer", ext);
  };

  const clear = () => {
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSrcUrl(null);
    setPreviewUrl(null);
    setNaturalW(0);
    setNaturalH(0);
    setWidthIn("");
    setHeightIn("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            Choose image
          </button>
          {(srcUrl || previewUrl) && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {naturalW > 0 && (
          <p className="text-xs text-muted-foreground">
            Original {naturalW}×{naturalH}px — JPEG quality applies to JPEG/WebP only.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium">Width (px)</label>
            <input
              type="number"
              min={1}
              max={16000}
              value={widthIn}
              onChange={(e) => updateWidth(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Height (px)</label>
            <input
              type="number"
              min={1}
              max={16000}
              value={heightIn}
              onChange={(e) => updateHeight(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Output format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ImgFmt)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Quality ({Math.round(quality * 100)}%)
            </label>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.02}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              disabled={format === "image/png"}
              className="w-full disabled:opacity-40"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lockAspect}
            onChange={(e) => setLockAspect(e.target.checked)}
            className="rounded"
          />
          Lock aspect ratio (uses original proportions)
        </label>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Source</p>
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-4">
              {srcUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={srcUrl}
                  alt="Original"
                  className="max-h-80 max-w-full object-contain"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No image yet — upload PNG, JPEG, or WebP.
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Resized preview</p>
              <button
                type="button"
                disabled={!previewUrl}
                onClick={download}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border bg-muted/20 p-4">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Resized preview"
                  className="max-h-80 max-w-full object-contain"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Preview appears after you set dimensions.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
