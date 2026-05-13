"use client";

import { useCallback, useState } from "react";
import {
  FileUp,
  Loader2,
  Play,
  Trash2,
  Plus,
  BookOpen,
  Code2,
  FileText,
} from "lucide-react";
import { parseIpynbJson, type NotebookCell } from "@/lib/playground/parse-ipynb";
import { ensurePyodide } from "@/lib/playground/pyodide-loader";
import { installPyodideStdin } from "@/lib/playground/pyodide-stdin";
import { PLAYGROUND_SURFACE_H } from "@/components/playground/PlaygroundEditorFrame";
import PlaygroundIoTabs from "@/components/playground/PlaygroundIoTabs";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const NB_STDIN_HINT =
  "Stdin tab: lines feed sys.stdin in order (shared for Run and Run all, like OneCompiler's I/O tab).";

const STARTER_TEMPLATE: Omit<NotebookCell, "id">[] = [
  {
    cellType: "markdown",
    source:
      "# Quick notebook\n\nEdit any cell. **Code** cells run in Pyodide (Python in the browser). Use **Run** on a cell or **Run all code**. Use the **Stdin** tab on the right for `sys.stdin` input.\n",
  },
  {
    cellType: "code",
    source: 'print("Hello from Python")\nfor i in range(3):\n    print("step", i)\n',
  },
];

export default function NotebookSandboxPanel() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [cells, setCells] = useState<NotebookCell[]>([]);
  const [stdin, setStdin] = useState("Ada\n");
  const [out, setOut] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningCellId, setRunningCellId] = useState<string | null>(null);

  const updateSource = useCallback((id: string, source: string) => {
    setCells((prev) => prev.map((c) => (c.id === id ? { ...c, source } : c)));
  }, []);

  const newNotebook = useCallback(() => {
    setFileName(null);
    setCells(STARTER_TEMPLATE.map((c) => ({ ...c, id: newId() })));
    setOut(["New notebook - edit cells below, then Run on a code cell or Run all."]);
  }, []);

  const addCell = useCallback((cellType: "code" | "markdown") => {
    const cell: NotebookCell = {
      id: newId(),
      cellType,
      source:
        cellType === "code"
          ? "print(42)\n"
          : "## Markdown\nDescribe what the next cell does.\n",
    };
    setCells((prev) => [...prev, cell]);
  }, []);

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const { title, cells: parsed } = parseIpynbJson(text);
        setCells(parsed.map((c) => ({ ...c, id: c.id && c.id.length ? c.id : newId() })));
        setOut([`Loaded "${title}" - ${parsed.length} cell(s). Edit and run below.`]);
      } catch (e) {
        setCells([]);
        setOut([`Could not parse notebook: ${e instanceof Error ? e.message : String(e)}`]);
      }
    };
    reader.readAsText(f);
  }, []);

  const runOne = useCallback(
    async (cellId: string) => {
      const cell = cells.find((c) => c.id === cellId);
      if (!cell || cell.cellType !== "code") return;
      setRunningCellId(cellId);
      setLoading(true);
      const lines: string[] = [`── run cell ──`];
      setOut(lines);
      try {
        const py = await ensurePyodide();
        installPyodideStdin(py, stdin);
        py.setStdout({ batched: (s) => lines.push(s) });
        py.setStderr({ batched: (s) => lines.push(`[stderr] ${s}`) });
        await py.runPythonAsync(cell.source, { filename: `<notebook-cell-${cellId}>` });
        setOut([...lines]);
      } catch (e) {
        lines.push(String(e instanceof Error ? e.message : e));
        setOut([...lines]);
      } finally {
        setLoading(false);
        setRunningCellId(null);
      }
    },
    [cells, stdin],
  );

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
      installPyodideStdin(py, stdin);
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
  }, [cells, stdin]);

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={newNotebook}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <BookOpen className="h-4 w-4" aria-hidden />
          New notebook
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
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
          disabled={loading || !cells.filter((c) => c.cellType === "code").length}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading && !runningCellId ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          Run all code
        </button>
        <button
          type="button"
          onClick={() => addCell("code")}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Code cell
        </button>
        <button
          type="button"
          onClick={() => addCell("markdown")}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Markdown
        </button>
        <button
          type="button"
          onClick={() => setOut([])}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Clear output
        </button>
        {fileName ? (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</span>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,400px)]">
        <div
          className={`flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-card p-3 shadow-sm ${PLAYGROUND_SURFACE_H}`}
        >
          {cells.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
              <p>Start with a sample notebook or open an .ipynb file.</p>
              <button
                type="button"
                onClick={newNotebook}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                New notebook
              </button>
            </div>
          ) : (
            cells.map((c, i) => (
              <div key={c.id} className="rounded-lg border border-border bg-background p-2 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {c.cellType === "code" ? <Code2 className="h-3 w-3" aria-hidden /> : <FileText className="h-3 w-3" aria-hidden />}
                    {c.cellType}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Cell {i + 1}</span>
                  {c.cellType === "code" ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void runOne(c.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {runningCellId === c.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : (
                        <Play className="h-3 w-3" aria-hidden />
                      )}
                      Run
                    </button>
                  ) : null}
                </div>
                <label className="sr-only" htmlFor={`nb-${c.id}`}>
                  {c.cellType} cell {i + 1}
                </label>
                <textarea
                  id={`nb-${c.id}`}
                  value={c.source}
                  onChange={(e) => updateSource(c.id, e.target.value)}
                  spellCheck={false}
                  className="min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 font-mono text-[13px] leading-relaxed text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  rows={Math.min(18, Math.max(5, c.source.split("\n").length + 1))}
                />
              </div>
            ))
          )}
        </div>
        <div className={`flex min-h-0 flex-col ${PLAYGROUND_SURFACE_H}`}>
          <PlaygroundIoTabs
            stdin={stdin}
            onStdinChange={setStdin}
            placeholder={"Ada\n"}
            hint={NB_STDIN_HINT}
            output={
              <pre
                className="p-3 font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap break-words"
                aria-live="polite"
              >
                {out.length ? out.join("\n") : "Output tab: Run or Run all. Stdin tab: lines for sys.stdin."}
              </pre>
            }
          />
        </div>
      </div>
    </div>
  );
}
