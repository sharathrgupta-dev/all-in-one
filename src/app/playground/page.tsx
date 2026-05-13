"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Braces, FileCode2, FlaskConical, NotebookPen } from "lucide-react";
import Header from "@/components/Header";
import { useExternalNavOrigin } from "@/hooks/use-external-nav-origin";
import JsTsSandboxPanel from "@/components/playground/JsTsSandboxPanel";
import PythonSandboxPanel from "@/components/playground/PythonSandboxPanel";
import NotebookSandboxPanel from "@/components/playground/NotebookSandboxPanel";
import { resolveToolHref } from "@/lib/site-config";

type PlaygroundTab = "javascript" | "typescript" | "python" | "notebook";

const TABS: { id: PlaygroundTab; label: string; short: string; icon: typeof Braces }[] = [
  { id: "javascript", label: "JavaScript", short: "JS", icon: Braces },
  { id: "typescript", label: "TypeScript", short: "TS", icon: FileCode2 },
  { id: "python", label: "Python", short: "Py", icon: FlaskConical },
  { id: "notebook", label: "Notebook", short: "ipynb", icon: NotebookPen },
];

export default function PlaygroundPage() {
  const [tab, setTab] = useState<PlaygroundTab>("javascript");
  const [dark, setDark] = useState(false);
  const navOrigin = useExternalNavOrigin();

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    requestAnimationFrame(sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href={resolveToolHref("/", navOrigin)}
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Home
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Code playground</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              JS and TS run in an isolated <code className="rounded bg-muted px-1">iframe</code> (no{" "}
              <code className="rounded bg-muted px-1">allow-same-origin</code>) with console forwarding. Python and
              notebooks use{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="https://pyodide.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pyodide
              </a>{" "}
              (WASM) loaded from jsDelivr on first use.
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Playground mode"
          className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/20 p-1"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
              </button>
            );
          })}
        </div>

        <section className="flex min-h-0 flex-1 flex-col" aria-live="polite">
          {tab === "javascript" ? <JsTsSandboxPanel mode="javascript" dark={dark} /> : null}
          {tab === "typescript" ? <JsTsSandboxPanel mode="typescript" dark={dark} /> : null}
          {tab === "python" ? <PythonSandboxPanel dark={dark} /> : null}
          {tab === "notebook" ? <NotebookSandboxPanel /> : null}
        </section>
      </main>
    </div>
  );
}
