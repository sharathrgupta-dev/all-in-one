"use client";

import type { ReactNode } from "react";
import PlaygroundIoTabs from "@/components/playground/PlaygroundIoTabs";

/** Viewport-based height so Monaco `height="100%"` always has a defined parent box. */
export const PLAYGROUND_SURFACE_H = "h-[min(58vh,640px)] min-h-[300px]";

export default function PlaygroundEditorFrame({
  toolbar,
  editor,
  output,
  stdin,
  onStdinChange,
  stdinPlaceholder,
  stdinDisabled,
  stdinHint,
}: {
  toolbar: ReactNode;
  editor: ReactNode;
  output: ReactNode;
  stdin: string;
  onStdinChange: (v: string) => void;
  stdinPlaceholder?: string;
  stdinDisabled?: boolean;
  stdinHint?: string;
}) {
  const h = PLAYGROUND_SURFACE_H;
  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
        <div
          className={`relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm ${h}`}
        >
          {editor}
        </div>
        <div className={`flex min-h-0 flex-col ${h}`}>
          <PlaygroundIoTabs
            output={output}
            stdin={stdin}
            onStdinChange={onStdinChange}
            placeholder={stdinPlaceholder}
            disabled={stdinDisabled}
            hint={stdinHint}
          />
        </div>
      </div>
    </div>
  );
}
