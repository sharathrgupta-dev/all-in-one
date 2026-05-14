"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Plus,
  X,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Trash2,
  Shield,
  Server,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  LAMBDA_EVENT_PRESETS,
  PRESETS_BY_ID,
  CATEGORY_LABELS,
  SAMPLE_HANDLER,
  type LambdaEventCategory,
} from "@/lib/lambda-events";
import {
  runLambda,
  formatBilled,
  makeRequestId,
  type LambdaLogEntry,
  type LambdaRunResult,
  type LogLevel,
} from "@/lib/lambda-runner";
import {
  trackToolError,
  trackToolSuccess,
  trackToolCopy,
} from "@/lib/analytics-events";

const TOOL_SLUG = "lambda-sandbox";

const MEMORY_OPTIONS = [128, 256, 512, 1024, 2048, 3008, 4096, 6144, 8192, 10240];
const TIMEOUT_OPTIONS = [3, 10, 30, 60, 120, 300, 600, 900];

type EnvVar = { id: string; key: string; value: string };

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function safeStringify(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function emptyEnv(): EnvVar {
  return { id: uid(), key: "", value: "" };
}

const LOG_LEVEL_STYLES: Record<LogLevel, string> = {
  log: "text-foreground",
  info: "text-foreground",
  debug: "text-muted-foreground",
  warn: "text-warning",
  error: "text-destructive",
};

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  log: "LOG",
  info: "INFO",
  debug: "DEBUG",
  warn: "WARN",
  error: "ERROR",
};

function formatLogTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(3)} s`;
}

function CopyBtn({
  text,
  label,
  what,
}: {
  text: string;
  label?: string;
  what: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!text}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        trackToolCopy(TOOL_SLUG, what);
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {label ?? (copied ? "Copied" : "Copy")}
    </button>
  );
}

function PresetMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const grouped = useMemo(() => {
    const buckets = new Map<LambdaEventCategory, typeof LAMBDA_EVENT_PRESETS[number][]>();
    for (const p of LAMBDA_EVENT_PRESETS) {
      const arr = buckets.get(p.category) ?? [];
      arr.push(p);
      buckets.set(p.category, arr);
    }
    return Array.from(buckets.entries());
  }, []);

  const current = PRESETS_BY_ID[value];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate font-medium">{current?.label ?? "Choose event"}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-auto rounded-lg border border-border bg-background shadow-lg"
          role="listbox"
        >
          {grouped.map(([cat, items]) => (
            <div key={cat} className="py-1">
              <div className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[cat]}
              </div>
              {items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                    p.id === value ? "bg-accent/10 text-accent" : "text-foreground"
                  }`}
                  role="option"
                  aria-selected={p.id === value}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground">{p.description}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LambdaSandboxPage() {
  const [code, setCode] = useState(SAMPLE_HANDLER);
  const [presetId, setPresetId] = useState<string>("apigw-v2-http");
  const [eventText, setEventText] = useState<string>(
    PRESETS_BY_ID["apigw-v2-http"].payload,
  );

  const [functionName, setFunctionName] = useState("devbench-sandbox-fn");
  const [region, setRegion] = useState("us-east-1");
  const [memoryMB, setMemoryMB] = useState(512);
  const [timeoutSec, setTimeoutSec] = useState(10);
  const [handlerName, setHandlerName] = useState("handler");
  const [envVars, setEnvVars] = useState<EnvVar[]>([emptyEnv()]);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LambdaRunResult | null>(null);
  const [tab, setTab] = useState<"response" | "logs" | "details">("response");

  // Switch event preset → swap editor contents.
  const onPresetChange = useCallback((id: string) => {
    setPresetId(id);
    const preset = PRESETS_BY_ID[id];
    if (preset) {
      setEventText(preset.payload);
    }
  }, []);

  // Derive JSON validation from input — no effect needed, so React's
  // "no setState in effect" rule is satisfied and parse runs at most once per render.
  const eventError = useMemo(() => {
    if (!eventText.trim()) return "";
    try {
      JSON.parse(eventText);
      return "";
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid JSON";
    }
  }, [eventText]);

  const envObject = useMemo(() => {
    const out: Record<string, string> = {};
    for (const e of envVars) {
      const k = e.key.trim();
      if (k) out[k] = e.value;
    }
    return out;
  }, [envVars]);

  const handleRun = useCallback(async () => {
    if (eventError) return;
    let eventValue: unknown;
    try {
      eventValue = eventText.trim() ? JSON.parse(eventText) : {};
    } catch {
      // eventError already surfaces this — useMemo recomputed when the user
      // typed; the early return above means we shouldn't reach here.
      return;
    }

    setRunning(true);
    setResult(null);

    const requestId = makeRequestId();
    try {
      const res = await runLambda({
        code,
        event: eventValue,
        env: envObject,
        timeoutMs: timeoutSec * 1000,
        handlerName: handlerName.trim() || "handler",
        context: {
          functionName,
          functionVersion: "$LATEST",
          invokedFunctionArn: `arn:aws:lambda:${region}:000000000000:function:${functionName}`,
          memoryLimitInMB: memoryMB,
          awsRequestId: requestId,
          logGroupName: `/aws/lambda/${functionName}`,
          logStreamName: `${new Date().toISOString().slice(0, 10)}/[$LATEST]${requestId.replace(/-/g, "")}`,
          region,
        },
      });
      setResult(res);
      setTab(res.ok ? "response" : "logs");
      if (res.ok) {
        trackToolSuccess(TOOL_SLUG, "invoke", {
          preset: presetId,
          duration_ms: Math.round(res.durationMs),
        });
      } else {
        trackToolError(TOOL_SLUG, "invoke", res.error.message);
      }
    } finally {
      setRunning(false);
    }
  }, [
    code,
    envObject,
    eventError,
    eventText,
    functionName,
    handlerName,
    memoryMB,
    presetId,
    region,
    timeoutSec,
  ]);

  // ⌘/Ctrl + Enter to run — common convention for "run" buttons in dev tools.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!running) handleRun();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleRun, running]);

  const handleReset = useCallback(() => {
    setCode(SAMPLE_HANDLER);
    setPresetId("apigw-v2-http");
    setEventText(PRESETS_BY_ID["apigw-v2-http"].payload);
    setEnvVars([emptyEnv()]);
    setResult(null);
  }, []);

  const responseText = useMemo(() => {
    if (!result) return "";
    if (!result.ok) {
      return safeStringify({
        errorType: result.error.name,
        errorMessage: result.error.message,
        stackTrace: result.error.stack?.split("\n") ?? [],
      });
    }
    return safeStringify(result.result);
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main" className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
          {/* Hero / title */}
          <header className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                AWS Lambda Sandbox
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                <Shield className="w-3 h-3" aria-hidden="true" />
                Runs in your browser
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Test Node.js Lambda handlers against canonical event payloads from API Gateway, SQS,
              S3, EventBridge, and more. Handlers execute in an isolated Web Worker — no AWS
              credentials, no network calls, nothing leaves your device.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ─── LEFT: Code + Event + Config ─── */}
            <div className="flex flex-col gap-5 min-w-0">
              {/* Handler code */}
              <section className="flex flex-col border border-border rounded-xl bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Handler
                    </span>
                    <code className="px-1.5 py-0.5 rounded bg-background text-[11px] font-mono text-muted-foreground border border-border">
                      Node.js 20.x
                    </code>
                  </div>
                  <CopyBtn text={code} what="handler-code" />
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-72 lg:h-80 px-3 py-2.5 text-[13px] font-mono leading-relaxed bg-background resize-y focus:outline-none placeholder:text-muted-foreground/40"
                  placeholder="exports.handler = async (event, context) => { ... }"
                />
              </section>

              {/* Event payload */}
              <section className="flex flex-col border border-border rounded-xl bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Event
                  </span>
                  <CopyBtn text={eventText} what="event-payload" />
                </div>
                <div className="px-3 py-2 border-b border-border">
                  <PresetMenu value={presetId} onChange={onPresetChange} />
                </div>
                <textarea
                  value={eventText}
                  onChange={(e) => setEventText(e.target.value)}
                  spellCheck={false}
                  className="w-full h-56 lg:h-64 px-3 py-2.5 text-[13px] font-mono leading-relaxed bg-background resize-y focus:outline-none placeholder:text-muted-foreground/40"
                  placeholder="{ ... }"
                />
                {eventError && (
                  <div className="px-3 py-1.5 text-[12px] text-destructive bg-destructive/5 border-t border-destructive/20 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{eventError}</span>
                  </div>
                )}
              </section>

              {/* Configuration */}
              <section className="border border-border rounded-xl bg-card p-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Configuration
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Function name</span>
                    <input
                      value={functionName}
                      onChange={(e) => setFunctionName(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Handler</span>
                    <input
                      value={handlerName}
                      onChange={(e) => setHandlerName(e.target.value)}
                      placeholder="handler or index.handler"
                      className="px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Region</span>
                    <input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Memory (MB)</span>
                    <select
                      value={memoryMB}
                      onChange={(e) => setMemoryMB(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                    >
                      {MEMORY_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} MB
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs col-span-2">
                    <span className="text-muted-foreground">Timeout (seconds)</span>
                    <select
                      value={timeoutSec}
                      onChange={(e) => setTimeoutSec(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                    >
                      {TIMEOUT_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}s
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Env vars */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Environment variables
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEnvVars((p) => [...p, emptyEnv()])}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <Plus className="w-3 h-3" aria-hidden="true" /> Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {envVars.map((env) => (
                      <div key={env.id} className="flex items-center gap-1.5">
                        <input
                          value={env.key}
                          onChange={(e) =>
                            setEnvVars((prev) =>
                              prev.map((p) => (p.id === env.id ? { ...p, key: e.target.value } : p)),
                            )
                          }
                          placeholder="KEY"
                          className="flex-1 px-2.5 py-1.5 text-[13px] font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring/40"
                        />
                        <input
                          value={env.value}
                          onChange={(e) =>
                            setEnvVars((prev) =>
                              prev.map((p) => (p.id === env.id ? { ...p, value: e.target.value } : p)),
                            )
                          }
                          placeholder="value"
                          className="flex-1 px-2.5 py-1.5 text-[13px] font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring/40"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEnvVars((prev) =>
                              prev.length === 1 ? [emptyEnv()] : prev.filter((p) => p.id !== env.id),
                            )
                          }
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          aria-label="Remove env var"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* ─── RIGHT: Run controls + Output ─── */}
            <div className="flex flex-col gap-5 min-w-0">
              {/* Action bar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={running || !!eventError}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {running ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                  {running ? "Invoking…" : "Invoke"}
                  <kbd className="hidden sm:inline text-[10px] font-mono opacity-70 ml-1">⌘↵</kbd>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={running}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Clear output
                  </button>
                )}
              </div>

              {/* Summary stat strip */}
              {result && (
                <div
                  className={`rounded-xl border px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${
                    result.ok
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {result.ok ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                        <span className="text-emerald-600 dark:text-emerald-400">Success</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-destructive" aria-hidden="true" />
                        <span className="text-destructive">
                          {result.timedOut ? "Task timed out" : "Error"}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Duration: {result.durationMs.toFixed(2)} ms</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Billed: {formatBilled(result.billedMs, memoryMB)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Server className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Memory: {memoryMB} MB</span>
                  </div>
                </div>
              )}

              {/* Output tabs */}
              <section className="border border-border rounded-xl bg-card overflow-hidden flex flex-col flex-1 min-h-[400px]">
                <div className="flex items-center justify-between border-b border-border bg-muted/40">
                  <div className="flex" role="tablist">
                    {(
                      [
                        ["response", "Response"],
                        ["logs", `Logs${result ? ` (${result.logs.length})` : ""}`],
                        ["details", "Details"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        role="tab"
                        aria-selected={tab === id}
                        className={`px-4 py-2 text-xs font-medium transition-colors ${
                          tab === id
                            ? "text-foreground border-b-2 border-accent"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {tab === "response" && responseText && (
                    <div className="pr-2">
                      <CopyBtn text={responseText} what="response" />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto">
                  {!result && (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-8 text-center">
                      Click <span className="mx-1 font-semibold">Invoke</span> to run the handler.
                      Output, logs, and timing will appear here.
                    </div>
                  )}

                  {result && tab === "response" && (
                    <pre className="px-3 py-2.5 text-[13px] font-mono leading-relaxed whitespace-pre-wrap break-words">
                      {responseText}
                    </pre>
                  )}

                  {result && tab === "logs" && (
                    <LogPanel logs={result.logs} />
                  )}

                  {result && tab === "details" && (
                    <DetailsPanel result={result} memoryMB={memoryMB} />
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Footer notes */}
          <div className="mt-6 text-xs text-muted-foreground max-w-3xl">
            <p className="leading-relaxed">
              <strong className="text-foreground">Sandbox limits:</strong> Code runs in a Web Worker
              with no DOM, no <code className="px-1 rounded bg-muted">fetch</code> to AWS, and no
              real <code className="px-1 rounded bg-muted">require()</code>. Calls to{" "}
              <code className="px-1 rounded bg-muted">aws-sdk</code> or{" "}
              <code className="px-1 rounded bg-muted">@aws-sdk/*</code> will throw — stub or mock
              them in your handler before testing. Timeout is enforced exactly like Lambda.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LogPanel({ logs }: { logs: LambdaLogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground p-8">
        No console output captured.
      </div>
    );
  }
  return (
    <div className="px-3 py-2 font-mono text-[12.5px] leading-relaxed">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2 py-0.5 border-b border-border/40 last:border-0">
          <span className="shrink-0 w-20 text-muted-foreground tabular-nums text-right">
            {formatLogTime(log.at)}
          </span>
          <span className={`shrink-0 w-12 font-semibold ${LOG_LEVEL_STYLES[log.level]}`}>
            {LOG_LEVEL_LABELS[log.level]}
          </span>
          <span className="whitespace-pre-wrap break-words flex-1 min-w-0">{log.message}</span>
        </div>
      ))}
    </div>
  );
}

function DetailsPanel({
  result,
  memoryMB,
}: {
  result: LambdaRunResult;
  memoryMB: number;
}) {
  return (
    <dl className="px-3 py-2 text-[13px] font-mono grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
      <dt className="text-muted-foreground">Status</dt>
      <dd className={result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
        {result.ok ? "Succeeded" : "Failed"}
      </dd>

      <dt className="text-muted-foreground">Duration</dt>
      <dd>{result.durationMs.toFixed(2)} ms</dd>

      <dt className="text-muted-foreground">Billed duration</dt>
      <dd>{result.billedMs} ms</dd>

      <dt className="text-muted-foreground">Memory size</dt>
      <dd>{memoryMB} MB</dd>

      <dt className="text-muted-foreground">Cost estimate</dt>
      <dd>{formatBilled(result.billedMs, memoryMB)}</dd>

      {!result.ok && (
        <>
          <dt className="text-muted-foreground">Error type</dt>
          <dd className="text-destructive">{result.error.name}</dd>

          <dt className="text-muted-foreground">Error message</dt>
          <dd className="text-destructive whitespace-pre-wrap break-words">{result.error.message}</dd>

          {result.error.stack && (
            <>
              <dt className="text-muted-foreground self-start">Stack</dt>
              <dd className="whitespace-pre-wrap break-words text-[12px] text-muted-foreground">
                {result.error.stack}
              </dd>
            </>
          )}
        </>
      )}
    </dl>
  );
}
