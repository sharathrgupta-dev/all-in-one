"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download, RefreshCw, ImageIcon } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

const FORMAT_LABELS: Record<OutputFormat, string> = {
  "image/png":  "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
};

const FORMAT_EXTS: Record<OutputFormat, string> = {
  "image/png":  "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const ACCEPTS = "image/png, image/jpeg, image/webp, image/bmp, image/gif, image/avif, image/tiff, image/svg+xml";

// Extract natural pixel dimensions from an SVG string (viewBox or width/height attrs)
function parseSvgDimensions(svgText: string): { w: number; h: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return { w: 800, h: 600 };

  const wAttr = svg.getAttribute("width");
  const hAttr = svg.getAttribute("height");
  const vb    = svg.getAttribute("viewBox");

  if (wAttr && hAttr) {
    const w = parseFloat(wAttr);
    const h = parseFloat(hAttr);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return { w, h };
  }
  if (vb) {
    const parts = vb.trim().split(/[\s,]+/).map(Number);
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      return { w: parts[2], h: parts[3] };
    }
  }
  return { w: 800, h: 600 };
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

export default function ImageFormatConverterTool({ tool }: { tool: Tool }) {
  const [srcUrl, setSrcUrl]       = useState<string | null>(null);
  const [srcName, setSrcName]     = useState("");
  const [srcSize, setSrcSize]     = useState(0);
  const [srcType, setSrcType]     = useState("");
  const [svgDims, setSvgDims]     = useState<{ w: number; h: number } | null>(null);

  const [outUrl, setOutUrl]       = useState<string | null>(null);
  const [outSize, setOutSize]     = useState(0);
  const [outFormat, setOutFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality]     = useState(92);
  const [converting, setConverting] = useState(false);
  const [dims, setDims]           = useState<{ w: number; h: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setSrcUrl(url);
    setSrcName(file.name);
    setSrcSize(file.size);
    setSrcType(file.type);
    setOutUrl(null);
    setDims(null);
    setSvgDims(null);

    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setSvgDims(parseSvgDimensions(text));
      };
      reader.readAsText(file);
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  function convert() {
    if (!srcUrl) return;
    setConverting(true);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      // SVGs may report 0 natural dimensions — use parsed viewBox/width attrs instead
      const w = img.naturalWidth  || svgDims?.w || 800;
      const h = img.naturalHeight || svgDims?.h || 600;
      canvas.width  = w;
      canvas.height = h;
      setDims({ w, h });

      const ctx = canvas.getContext("2d")!;
      // Fill white background for JPEG (transparent → white), also good default for SVG
      if (outFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const q = outFormat === "image/png" ? undefined : quality / 100;
      canvas.toBlob(
        (blob) => {
          if (!blob) { setConverting(false); return; }
          const url = URL.createObjectURL(blob);
          setOutUrl(url);
          setOutSize(blob.size);
          setConverting(false);
        },
        outFormat,
        q,
      );
    };
    img.src = srcUrl;
  }

  function download() {
    if (!outUrl) return;
    const a = document.createElement("a");
    const base = srcName.replace(/\.[^.]+$/, "");
    a.href = outUrl;
    a.download = `${base}.${FORMAT_EXTS[outFormat]}`;
    a.click();
  }

  const savings = outSize && srcSize ? ((1 - outSize / srcSize) * 100).toFixed(1) : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-accent/50 hover:bg-muted/30 transition-colors"
        >
          {srcUrl ? (
            <img src={srcUrl} alt="Source" className="max-h-48 mx-auto rounded-xl object-contain" />
          ) : (
            <>
              <ImageIcon className="mx-auto w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drop an image or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">SVG · PNG · JPEG · WebP · BMP · GIF · AVIF · TIFF</p>
            </>
          )}
          <input ref={inputRef} type="file" accept={ACCEPTS} className="hidden" onChange={onFileChange} />
        </div>

        {srcUrl && (
          <>
            {/* Source info */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-lg bg-muted font-mono">{srcName}</span>
              <span className="px-2.5 py-1 rounded-lg bg-muted">{srcType.split("/")[1].toUpperCase()}</span>
              <span className="px-2.5 py-1 rounded-lg bg-muted">{formatBytes(srcSize)}</span>
              {dims && <span className="px-2.5 py-1 rounded-lg bg-muted">{dims.w} × {dims.h}px</span>}
            </div>

            {/* Conversion controls */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <div className="flex flex-wrap items-end gap-6">
                {/* Output format */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Output format</label>
                  <div className="flex gap-2">
                    {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setOutFormat(fmt)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          outFormat === fmt
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-muted text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {FORMAT_LABELS[fmt]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality — only for lossy formats */}
                {outFormat !== "image/png" && (
                  <div className="space-y-1.5 flex-1 min-w-[200px]">
                    <label className="text-xs text-muted-foreground font-medium">
                      Quality — {quality}%
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                )}

                <button
                  onClick={convert}
                  disabled={converting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${converting ? "animate-spin" : ""}`} />
                  {converting ? "Converting…" : "Convert"}
                </button>
              </div>
            </div>

            {/* Result */}
            {outUrl && (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="px-2.5 py-1 rounded-lg bg-muted">{FORMAT_LABELS[outFormat]}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-muted">{formatBytes(outSize)}</span>
                    {savings !== null && (
                      <span className={`px-2.5 py-1 rounded-lg font-medium ${
                        Number(savings) > 0
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {Number(savings) > 0 ? `${savings}% smaller` : `${Math.abs(Number(savings))}% larger`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={download}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <img src={outUrl} alt="Converted" className="max-h-60 mx-auto rounded-xl object-contain" />
              </div>
            )}
          </>
        )}

        {/* Hidden canvas for conversion */}
        <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
}
