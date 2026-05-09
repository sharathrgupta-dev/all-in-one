"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

const SAMPLE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 40rem; margin: 0 auto; }
    h1 { color: #111; }
    p { line-height: 1.6; color: #333; }
  </style>
</head>
<body>
  <h1>Hello</h1>
  <p>Edit this HTML, then use <strong>Print → Save as PDF</strong> in the dialog.</p>
</body>
</html>`;

export default function HtmlToPdfTool({ tool }: { tool: Tool }) {
  const [html, setHtml] = useState(SAMPLE);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const iframeSrcDoc = useMemo(() => {
    const t = html.trim();
    if (/^\s*<!doctype/i.test(t) || /<html[\s>]/i.test(t)) return html;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:system-ui,sans-serif;padding:1.25rem;line-height:1.55;color:#111}</style></head><body>${t}</body></html>`;
  }, [html]);

  const printFrame = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Paste HTML (full document or a fragment). Preview updates live. Printing uses
          your browser — choose <strong>Save as PDF</strong> as the destination. Only
          paste HTML you trust.
        </p>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          spellCheck={false}
          className="min-h-[200px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={printFrame}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: In the print dialog, set margins to “Default” or “Minimum” for a cleaner
          PDF. Safari and Chrome both support “Save as PDF”.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          <p className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            Live preview
          </p>
          <iframe
            ref={iframeRef}
            title="HTML preview"
            className="h-[min(420px,50vh)] w-full bg-white"
            sandbox="allow-popups allow-modals allow-same-origin"
            srcDoc={iframeSrcDoc}
          />
        </div>
      </div>
    </main>
  );
}
