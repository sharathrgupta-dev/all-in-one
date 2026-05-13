"use client";

import { useCallback, useState } from "react";
import { FileUp, Loader2, Play, Trash2 } from "lucide-react";
import { parseIpynbJson, type NotebookCell } from "@/lib/playground/parse-ipynb";
import { ensurePyodide } from "@/lib/playground/pyodide-loader";

export default function NotebookSandboxPanel() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [cells, setCells] = useState<NotebookCell[]>([]);
  const [out, setOut] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const { title, cells: parsed } = parseIpynbJson(text);
        setCells(parsed);
        setOut([`Loaded "${title}" — ${parsed.length} cell(s).`]);
      } catch (e) {
        setCells([]);
        setOut([`Could not parse notebook: ${e instanceof Error ? e.message : String(e)}`]);
      }
    };
    reader.readAsText(f);
  }, []);

  const runAllCode = useCallback(async () => {
    const codeCells = cells.filter((c) => c.cellType === "code");
    if (!codeCells.length) {
      setOut(["No code cells to run."]);
      return;
    }
    setLoading(true);
    const lines: string[] = [];
    try {
      const py = await ensurePyodide();
      py.setStdout({ batched: (s) => lines.push(s) });
      py.setStderr({ batched: (s) => lines.push(`[stderr] ${s}`) });
      let idx = 0;
      for (const c of codeCells) {
        idx += 1;
        lines.push(`── cell ${idx} ──`);
        setOut([...lines]);
        await py.runPythonAsync(c.source, { filename: `<cell-${idx}>` });
      }
      setOut(lines.length ? lines : ["(no output)"]);
    } catch (e) {
      lines.push(String(e instanceof Error ? e.message : e));
      setOut(lines);
    } finally {
      setLoading(false);
    }
  }, [cells]);

  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
          <FileUp className="h-4 w-4" aria-hidden />
          Open .ipynb
          <input
            type="file"
            accept=".ipynb,application/json"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={() => void runAllCode()}
          disabled={loading || !cells.length}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
          Run all code cells
        </button>
        <button
          type="button"
          onClick={() => setOut([])}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Clear output
        </button>
        {fileName ? <span className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</span> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Code and markdown cells are shown in order. Only code cells execute, sequentially, in one Pyodide session (imports persist).
      </p>
      <div className="grid flex-1 gap-3 lg:grid-cols-2 min-h-0">
        <div className="max-h-[480px] overflow-auto rounded-lg border border-border">
          <ul className="divide-y divide-border">
            {cells.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">Upload a Jupyter notebook (.ipynb) to preview cells.</li>
            ) : (
              cells.map((c) => (
                <li key={c.id} className="p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {c.cellType}
                  </div>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words text-foreground">{c.source || "(empty)"}</pre>
                </li>
              ))
            )}
          </ul>
        </div>
        <pre
          className="max-h-[480px] overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words"
          aria-live="polite"
        >
          {out.length ? out.join("\n") : "Output from Run all code cells appears here."}
        </pre>
      </div>
    </div>
  );
}
