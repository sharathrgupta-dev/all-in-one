"use client";

import { useCallback, useRef, useState } from "react";
import type { Tool } from "@/lib/tools-registry";
import { trackToolDownload } from "@/lib/analytics-events";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { Upload, Download, RotateCcw, ImageIcon, Loader2, CheckCircle2, AlertCircle, SlidersHorizontal } from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────
type Phase =
  | { status: "idle" }
  | { status: "loading"; label: string; pct: number }
  | { status: "done"; originalUrl: string; resultUrl: string; resultBlob: Blob }
  | { status: "error"; message: string };

// ─── progress label helpers ──────────────────────────────────────────────────
function labelFor(key: string, pct: number): string {
  if (key.startsWith("fetch:")) {
    const name = key.replace("fetch:", "");
    return `Downloading model${name ? ` (${name})` : ""}… ${pct}%`;
  }
  if (key === "compute:decode")    return "Decoding image…";
  if (key === "compute:inference") return "Running AI inference…";
  if (key === "compute:mask")      return "Applying mask…";
  if (key === "compute:encode")    return "Encoding result…";
  return `Processing… ${pct}%`;
}

// ─── before/after comparison slider ──────────────────────────────────────────
function CompareSlider({ originalUrl, resultUrl }: { originalUrl: string; resultUrl: string }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
    setPos((x / rect.width) * 100);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updatePos(e.clientX);
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl border border-border cursor-col-resize"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* checkerboard background for transparency */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='0' width='8' height='8' fill='%23f9fafb'/%3E%3Crect x='0' y='8' width='8' height='8' fill='%23f9fafb'/%3E%3C/svg%3E\")", backgroundSize: "16px 16px" }}
      />
      {/* result (right) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resultUrl} alt="Background removed" className="relative block w-full h-auto max-h-[70vh] object-contain" draggable={false} />
      {/* original (left, clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={originalUrl} alt="Original" className="block w-full h-auto max-h-[70vh] object-contain" draggable={false} />
      </div>
      {/* divider */}
      <div className="absolute inset-y-0 z-10 flex items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
        <div className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow-lg">
          <SlidersHorizontal className="h-4 w-4 text-gray-700" />
        </div>
      </div>
      {/* labels */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">Before</div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">After</div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function BackgroundRemoverTool({ tool }: { tool: Tool }) {
  const [phase, setPhase] = useState<Phase>({ status: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPhase({ status: "error", message: "Please upload a JPG, PNG, or WebP image." });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setPhase({ status: "error", message: "File is too large. Maximum size is 25 MB." });
      return;
    }

    const originalUrl = URL.createObjectURL(file);
    setPhase({ status: "loading", label: "Starting…", pct: 0 });

    try {
      const { removeBackground } = await import("@imgly/background-removal");

      const resultBlob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0;
          setPhase({ status: "loading", label: labelFor(key, pct), pct });
        },
        output: { format: "image/png", quality: 1 },
      });

      const resultUrl = URL.createObjectURL(resultBlob);
      setPhase({ status: "done", originalUrl, resultUrl, resultBlob });
    } catch (e) {
      URL.revokeObjectURL(originalUrl);
      const msg = e instanceof Error ? e.message : "An unexpected error occurred.";
      setPhase({ status: "error", message: msg });
    }
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files?.[0]) processFile(files[0]);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const reset = useCallback(() => {
    if (phase.status === "done") {
      URL.revokeObjectURL(phase.originalUrl);
      URL.revokeObjectURL(phase.resultUrl);
    }
    setPhase({ status: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [phase]);

  const download = useCallback(() => {
    if (phase.status !== "done") return;
    const a = document.createElement("a");
    a.href = phase.resultUrl;
    a.download = "background-removed.png";
    a.click();
    trackToolDownload("background-remover", "png");
  }, [phase]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-6">
        {/* ── idle / upload ── */}
        {phase.status === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50 hover:bg-muted/30"
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Upload className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="text-base font-semibold">Drop an image here, or click to upload</p>
              <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WebP — up to 25 MB</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1">🔒 Runs 100% in your browser</span>
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1">🤖 AI-powered segmentation</span>
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1">🖼 Outputs transparent PNG</span>
              <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1">📦 Model cached after first use</span>
            </div>
          </div>
        )}

        {/* ── loading ── */}
        {phase.status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card p-16 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"
                style={{ animationDuration: "1s" }}
              />
              <Loader2 className="h-8 w-8 text-accent animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold">{phase.label}</p>
              <div className="mx-auto h-1.5 w-64 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.max(4, phase.pct)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              The first run downloads ~35 MB of model files from CDN. Subsequent uses are instant (cached).
            </p>
          </div>
        )}

        {/* ── result ── */}
        {phase.status === "done" && (
          <div className="space-y-4">
            {/* success bar */}
            <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Background removed successfully</p>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={download}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Remove another
                </button>
              </div>
            </div>

            {/* slider */}
            <CompareSlider originalUrl={phase.originalUrl} resultUrl={phase.resultUrl} />

            {/* standalone result on checkerboard */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Original</p>
                <div className="overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={phase.originalUrl} alt="Original" className="w-full object-contain max-h-60" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Result (transparent)</p>
                <div
                  className="overflow-hidden rounded-xl border border-border"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23e5e7eb'/%3E%3Crect x='8' y='0' width='8' height='8' fill='%23f9fafb'/%3E%3Crect x='0' y='8' width='8' height='8' fill='%23f9fafb'/%3E%3C/svg%3E\")", backgroundSize: "16px 16px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={phase.resultUrl} alt="Result" className="w-full object-contain max-h-60" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── error ── */}
        {phase.status === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Something went wrong</p>
                <p className="mt-1 text-sm text-muted-foreground">{phase.message}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {/* ── how it works ── */}
        {phase.status === "idle" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Upload, title: "1. Upload", desc: "Drop any portrait, product, or object photo. JPG, PNG, or WebP." },
              { icon: ImageIcon, title: "2. AI processes it", desc: "An ONNX segmentation model runs locally in your browser — nothing is sent to a server." },
              { icon: Download, title: "3. Download PNG", desc: "Get a transparent-background PNG ready for Figma, Canva, presentations, or anywhere." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <item.icon className="h-4 w-4 text-accent" />
                </div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </main>
  );
}
