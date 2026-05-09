"use client";

import { useCallback, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Download, Loader2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";
import { downloadUint8 } from "@/lib/pdf-download";

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 50;
const FONT_SIZE = 11;
const LINE_HEIGHT = FONT_SIZE * 1.35;

function wrapParagraph(
  paragraph: string,
  measure: (s: string) => number,
  maxW: number
): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (measure(trial) <= maxW) {
      current = trial;
      continue;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    if (measure(word) <= maxW) {
      current = word;
      continue;
    }
    let acc = "";
    for (const ch of word) {
      const t = acc + ch;
      if (measure(t) <= maxW) acc = t;
      else {
        if (acc) lines.push(acc);
        acc = ch;
      }
    }
    current = acc;
  }
  if (current) lines.push(current);
  return lines;
}

export default function TextToPdfTool({ tool }: { tool: Tool }) {
  const [text, setText] = useState(
    "Paste or type plain text here.\n\nEach paragraph wraps to the page width; long content continues on new pages."
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const build = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const maxW = A4_W - 2 * MARGIN;
      const measure = (s: string) => font.widthOfTextAtSize(s, FONT_SIZE);

      let page = doc.addPage([A4_W, A4_H]);
      let y = A4_H - MARGIN;

      const paragraphs = text.replace(/\r\n/g, "\n").split("\n");

      const flushPage = () => {
        page = doc.addPage([A4_W, A4_H]);
        y = A4_H - MARGIN;
      };

      for (const para of paragraphs) {
        const lines =
          para.trim() === "" ? [] : wrapParagraph(para, measure, maxW);

        if (lines.length === 0) {
          y -= LINE_HEIGHT * 0.75;
          continue;
        }

        for (const line of lines) {
          if (y < MARGIN + LINE_HEIGHT) flushPage();
          page.drawText(line, {
            x: MARGIN,
            y: y - FONT_SIZE,
            size: FONT_SIZE,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
          y -= LINE_HEIGHT;
        }
        y -= LINE_HEIGHT * 0.25;
      }

      const bytes = await doc.save();
      downloadUint8(bytes, "document-from-text.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build PDF.");
    } finally {
      setBusy(false);
    }
  }, [text]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="animate-slide-up space-y-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Converts plain text to a printable A4 PDF with automatic line wrapping and
          pagination — all in your browser.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="min-h-[280px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm"
          placeholder="Type or paste text…"
        />
        <button
          type="button"
          onClick={() => void build()}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
