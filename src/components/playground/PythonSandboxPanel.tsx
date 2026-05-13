"use client";

import { useCallback, useEffect, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { Loader2, Play, Trash2 } from "lucide-react";
import { PLAYGROUND_MONACO_VS_CDN } from "@/lib/playground/constants";
import { ensurePyodide } from "@/lib/playground/pyodide-loader";

let monacoCdnConfigured = false;
function ensureMonacoCdn(): void {
  if (monacoCdnConfigured) return;
  monacoCdnConfigured = true;
  loader.config({ paths: { vs: PLAYGROUND_MONACO_VS_CDN } });
}

const DEFAULT_PY = `import sys

print("Python", sys.version.split()[0])
for i in range(3):
    print("tick", i)
`;

export default function PythonSandboxPanel({ dark }: { dark: boolean }) {
  const [code, setCode] = useState(DEFAULT_PY);
  const [out, setOut] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pyReady, setPyReady] = useState(false);

  useEffect(() => {
    ensureMonacoCdn();
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    const lines: string[] = [];
    try {
      const py = await ensurePyodide();
      py.setStdout({ batched: (s) => lines.push(s) });
      py.setStderr({ batched: (s) => lines.push(`[stderr] ${s}`) });
      await py.runPythonAsync(code, { filename: "<playground>" });
      setPyReady(true);
      setOut(lines.length ? lines : ["(no stdout — finished)"]);
    } catch (e) {
      setOut([String(e instanceof Error ? e.message : e)]);
    } finally {
      setLoading(false);
    }
  }, [code]);

  const theme = dark ? "vs-dark" : "vs";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4 min-h-0 flex-1">
      <div className="flex min-h-[280px] flex-1 flex-col gap-2 lg:min-h-[420px]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            Run Python
          </button>
          <button
            type="button"
            onClick={() => setOut([])}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear
          </button>
          <span className="text-xs text-muted-foreground">
            {pyReady ? "Pyodide loaded (WASM, jsDelivr)." : "First run downloads the Pyodide runtime (~10–20 MB)."}
          </span>
        </div>
        <div className="min-h-[240px] flex-1 overflow-hidden rounded-lg border border-border">
          <Editor
            height="380"
            language="python"
            theme={theme}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>
      </div>
      <div className="flex min-h-[200px] flex-1 flex-col gap-2 lg:max-w-md">
        <h3 className="text-sm font-medium text-foreground">Stdout / stderr</h3>
        <pre
          className="max-h-[420px] flex-1 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words"
          aria-live="polite"
        >
          {out.length ? out.join("\n") : "Run to capture print() and errors here."}
        </pre>
      </div>
    </div>
  );
}
