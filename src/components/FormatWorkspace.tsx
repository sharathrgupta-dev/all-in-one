"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles, FileJson } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import Link from "next/link";
import {
  BEAUTIFIER_LANGS,
  CODE_SAMPLES,
  beautifyCode,
  type BeautifierLang,
} from "@/lib/code-beautifiers";

export default function FormatWorkspace() {
  const [lang, setLang] = useState<BeautifierLang>("javascript");
  const [input, setInput] = useState(CODE_SAMPLES.javascript);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runBeautify = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const r = await beautifyCode(lang, input);
      if (r.ok) {
        setOutput(r.output);
      } else {
        setOutput("");
        setError(r.error);
      }
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [lang, input]);

  const loadSample = useCallback(() => {
    setInput(CODE_SAMPLES[lang]);
    setOutput("");
    setError("");
  }, [lang]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Online beautifier
          </h2>
          <p className="text-sm text-muted-foreground">
            Format HTML, CSS, SCSS, Less, JavaScript, TypeScript, TSX, JSON,
            Markdown, YAML, GraphQL, XML, and SQL with{" "}
            <span className="text-foreground/90">Prettier</span> /{" "}
            <span className="text-foreground/90">sql-formatter</span>. Python
            uses indent normalization (4 spaces per depth).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/json"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <FileJson className="h-4 w-4" />
            Full JSON workspace
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground shrink-0">Language</label>
        <select
          value={lang}
          onChange={(e) => {
            const next = e.target.value as BeautifierLang;
            setLang(next);
            setInput(CODE_SAMPLES[next]);
            setOutput("");
            setError("");
          }}
          className="min-w-[180px] flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 sm:max-w-xs"
        >
          {BEAUTIFIER_LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label} — {l.hint}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={loadSample}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Load sample
        </button>
        <button
          type="button"
          onClick={runBeautify}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Beautify
        </button>
        <CopyButton text={output} className="shrink-0" disabled={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex min-h-[280px] flex-col rounded-xl border border-border bg-card overflow-hidden">
          <span className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Input
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="min-h-[240px] flex-1 resize-y bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-inset focus:ring-ring/30"
            placeholder="Paste messy code…"
          />
        </div>
        <div className="flex min-h-[280px] flex-col rounded-xl border border-border bg-card overflow-hidden">
          <span className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Output
          </span>
          {error ? (
            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-sm text-destructive">
              {error}
            </pre>
          ) : (
            <textarea
              readOnly
              value={output}
              placeholder="Click Beautify…"
              className="min-h-[240px] flex-1 resize-y bg-muted/20 px-3 py-2 font-mono text-sm text-foreground outline-none"
            />
          )}
        </div>
      </div>
    </section>
  );
}
