"use client";

import { useState, type ReactNode } from "react";

type IoTab = "output" | "stdin";

export default function PlaygroundIoTabs({
  output,
  stdin,
  onStdinChange,
  placeholder,
  disabled,
  hint,
}: {
  output: ReactNode;
  stdin: string;
  onStdinChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const [tab, setTab] = useState<IoTab>("output");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">I/O</span>
        <div className="flex rounded-lg border border-border bg-muted/40 p-0.5" role="tablist" aria-label="Input and output">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "output"}
            onClick={() => setTab("output")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === "output" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Output
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "stdin"}
            onClick={() => setTab("stdin")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === "stdin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Stdin
          </button>
        </div>
      </div>
      {hint ? <p className="text-[11px] leading-snug text-muted-foreground shrink-0">{hint}</p> : null}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-muted/25 shadow-inner">
        {tab === "output" ? (
          <div className="h-full min-h-0 overflow-auto">{output}</div>
        ) : (
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            disabled={disabled}
            spellCheck={false}
            placeholder={placeholder}
            className="h-full min-h-[120px] w-full resize-none bg-background p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Standard input"
          />
        )}
      </div>
    </div>
  );
}
