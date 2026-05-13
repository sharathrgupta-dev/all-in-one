"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { Play, Trash2, Loader2 } from "lucide-react";
import { PLAYGROUND_MONACO_VS_CDN } from "@/lib/playground/constants";
import { getSandboxJsSrcdoc } from "@/lib/playground/sandbox-js-srcdoc";
import { isSandboxChildMessage } from "@/lib/playground/sandbox-js-messages";
import { transpileTsToJs } from "@/lib/playground/transpile-ts";

let monacoCdnConfigured = false;
function ensureMonacoCdn(): void {
  if (monacoCdnConfigured) return;
  monacoCdnConfigured = true;
  loader.config({ paths: { vs: PLAYGROUND_MONACO_VS_CDN } });
}

const DEFAULT_JS = `console.log("Hello from the sandbox");

for (let i = 0; i < 3; i++) {
  console.info("tick", i);
}
`;

const DEFAULT_TS = `type Point = { x: number; y: number };

const p: Point = { x: 2, y: 3 };
console.log("length^2 =", p.x * p.x + p.y * p.y);
`;

export type JsTsMode = "javascript" | "typescript";

export default function JsTsSandboxPanel({
  mode,
  dark,
}: {
  mode: JsTsMode;
  dark: boolean;
}) {
  const [code, setCode] = useState(mode === "typescript" ? DEFAULT_TS : DEFAULT_JS);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runIdRef = useRef(0);
  const pendingRunRef = useRef<{
    id: number;
    lines: string[];
    sawDone: boolean;
    sawError: boolean;
  } | null>(null);

  const srcdoc = useMemo(() => getSandboxJsSrcdoc(), []);

  useEffect(() => {
    ensureMonacoCdn();
  }, []);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || ev.source !== win) return;
      if (!isSandboxChildMessage(ev.data)) return;
      const d = ev.data;
      if (d.type === "READY") {
        setIframeReady(true);
        return;
      }
      const pending = pendingRunRef.current;
      if (!pending || d.id !== pending.id) return;
      if (d.type === "LOG") {
        const line = `[${d.level}] ${d.args.join(" ")}`;
        pending.lines.push(line);
        setOutput([...pending.lines]);
        return;
      }
      if (d.type === "UNCAUGHT" || d.type === "ERROR") {
        pending.sawError = true;
        pending.lines.push(d.type === "UNCAUGHT" ? `Uncaught: ${d.message}` : `Error: ${d.message}`);
        if (d.stack) pending.lines.push(d.stack);
        setOutput([...pending.lines]);
        setRunning(false);
        pendingRunRef.current = null;
        return;
      }
      if (d.type === "DONE") {
        pending.sawDone = true;
        if (!pending.sawError && pending.lines.length === 0) {
          pending.lines.push("(finished — no console output)");
          setOutput([...pending.lines]);
        }
        setRunning(false);
        pendingRunRef.current = null;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const run = useCallback(async () => {
    if (running) return;
    let js = code.trimEnd();

    if (mode === "typescript") {
      setRunning(true);
      setOutput(["Transpiling TypeScript…"]);
      const tr = await transpileTsToJs(code);
      if ("errors" in tr) {
        setOutput(tr.errors.split("\n").filter(Boolean));
        setRunning(false);
        return;
      }
      js = tr.js;
    } else {
      setRunning(true);
    }

    if (!iframeReady || !iframeRef.current?.contentWindow) {
      setOutput(["Sandbox iframe is not ready yet. Try again in a moment."]);
      setRunning(false);
      return;
    }
    const id = ++runIdRef.current;
    const lines: string[] = [];
    pendingRunRef.current = { id, lines, sawDone: false, sawError: false };
    setOutput([]);
    iframeRef.current.contentWindow.postMessage({ type: "RUN", id, code: js }, "*");
  }, [code, iframeReady, mode, running]);

  const theme = dark ? "vs-dark" : "vs";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4 min-h-0 flex-1">
      <div className="flex min-h-[280px] flex-1 flex-col gap-2 lg:min-h-[420px]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={running || !iframeReady}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            Run
          </button>
          <button
            type="button"
            onClick={() => setOutput([])}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear output
          </button>
          <span className="text-xs text-muted-foreground">
            {iframeReady ? "Sandbox ready (opaque origin, no same-origin)." : "Loading sandbox…"}
          </span>
        </div>
        <div className="min-h-[240px] flex-1 overflow-hidden rounded-lg border border-border">
          <Editor
            height="380"
            language={mode}
            theme={theme}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>
      <div className="flex min-h-[200px] flex-1 flex-col gap-2 lg:max-w-md">
        <h3 className="text-sm font-medium text-foreground">Output</h3>
        <pre
          className="max-h-[420px] flex-1 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words"
          aria-live="polite"
        >
          {output.length ? output.join("\n") : "Run your snippet to see console output here."}
        </pre>
      </div>
      <iframe
        ref={iframeRef}
        title="JavaScript sandbox"
        sandbox="allow-scripts"
        className="pointer-events-none fixed h-0 w-0 opacity-0"
        srcDoc={srcdoc}
      />
    </div>
  );
}
