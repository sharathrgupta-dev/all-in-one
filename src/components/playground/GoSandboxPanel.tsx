"use client";

import { useCallback, useEffect, useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { Loader2, Play, Trash2, Keyboard, ExternalLink } from "lucide-react";
import { PLAYGROUND_MONACO_VS_CDN } from "@/lib/playground/constants";
import PlaygroundEditorFrame from "@/components/playground/PlaygroundEditorFrame";

let monacoCdnConfigured = false;
function ensureMonacoCdn(): void {
  if (monacoCdnConfigured) return;
  monacoCdnConfigured = true;
  loader.config({ paths: { vs: PLAYGROUND_MONACO_VS_CDN } });
}

const DEFAULT_GO = `package main

import "fmt"

func main() {
	fmt.Println("Hello, Go")
}
`;

const GO_STDIN_HINT =
  "The official play.golang.org compile API used here does not expose stdin. Use fmt with literals, or run Scan-style programs on go.dev/play.";

export default function GoSandboxPanel({ dark }: { dark: boolean }) {
  const [code, setCode] = useState(DEFAULT_GO);
  const [stdin, setStdin] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureMonacoCdn();
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setOut("Running on play.golang.org…");
    try {
      const res = await fetch("/api/playground/go", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { output?: string; error?: string };
      if (!res.ok) {
        setOut(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setOut(data.output ?? "(empty response)");
    } catch (e) {
      setOut(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "Enter") return;
      if (loading) return;
      e.preventDefault();
      void run();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, loading]);

  const theme = dark ? "vs-dark" : "vs";

  return (
    <PlaygroundEditorFrame
      toolbar={
        <>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            Run Go
          </button>
          <button
            type="button"
            onClick={() => setOut("")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear output
          </button>
          <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Ctrl+Enter
          </span>
          <a
            href="https://go.dev/play/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent underline-offset-2 hover:underline"
          >
            go.dev/play
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <span className="text-xs text-muted-foreground max-w-[min(100%,320px)]">
            Same engine family as{" "}
            <a className="underline underline-offset-2" href="https://onecompiler.com/go" target="_blank" rel="noopener noreferrer">
              OneCompiler Go
            </a>{" "}
            (remote compile).
          </span>
        </>
      }
      stdin={stdin}
      onStdinChange={setStdin}
      stdinPlaceholder="Not wired for remote Go compile API"
      stdinDisabled
      stdinHint={GO_STDIN_HINT}
      editor={
        <Editor
          height="100%"
          language="go"
          theme={theme}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          loading={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading editor…
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12 },
          }}
        />
      }
      output={
        <pre
          className="p-3 font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap break-words"
          aria-live="polite"
        >
          {out || "Output tab: build and run. Stdin tab is informational for Go here."}
        </pre>
      }
    />
  );
}
