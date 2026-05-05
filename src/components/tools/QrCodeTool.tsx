"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

export default function QrCodeTool({ tool }: { tool: Tool }) {
  const [text, setText] = useState("https://");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    const t = text.trim();
    if (!t) {
      setDataUrl(null);
      setErr("");
      return;
    }
    QRCode.toDataURL(t, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setErr("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setErr("Could not generate QR for this input.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />
      <div className="animate-slide-up space-y-6 rounded-2xl border border-border bg-card p-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Content (URL or text)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            spellCheck={false}
          />
        </div>
        {err && (
          <p className="text-sm text-destructive" role="alert">
            {err}
          </p>
        )}
        <div className="flex flex-wrap items-start gap-8">
          <div className="rounded-xl border border-border bg-white p-4 dark:bg-white">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt="QR code" width={280} height={280} className="block" />
            ) : (
              <div className="flex h-[280px] w-[280px] items-center justify-center text-sm text-muted-foreground">
                Enter text to generate
              </div>
            )}
          </div>
          <div className="space-y-3">
            <button
              type="button"
              disabled={!dataUrl}
              onClick={download}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
            <p className="max-w-sm text-xs text-muted-foreground">
              Generated entirely in your browser. Large payloads may hit QR version limits.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
