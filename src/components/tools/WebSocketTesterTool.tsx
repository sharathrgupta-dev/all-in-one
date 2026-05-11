"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Plug, Unplug, Trash2, Download, ArrowDownToLine, ArrowUpFromLine, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import ToolPageHero from "@/components/tools/ToolPageHero";

type Direction = "out" | "in" | "info" | "error";
type ConnState = "idle" | "connecting" | "open" | "closing" | "closed";

interface LogEntry {
  id: number;
  time: number; // epoch ms
  dir: Direction;
  text: string;
  size?: number;
}

const SAMPLE_URLS = [
  { label: "Postman echo", url: "wss://ws.postman-echo.com/raw" },
  { label: "Mock binance", url: "wss://stream.binance.com:9443/ws/btcusdt@trade" },
];

const STORAGE_KEY = "devbench:ws-tester:url";

function shortenBytes(n?: number) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString(undefined, { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
}

export default function WebSocketTesterTool({ tool }: { tool: Tool }) {
  const [url, setUrl] = useState("");
  const [protocols, setProtocols] = useState("");
  const [conn, setConn] = useState<ConnState>("idle");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [error, setError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const logIdRef = useRef(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Hydrate URL from localStorage on mount. setState here is correct:
  // one-shot synchronisation from an external source (browser storage).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setUrl(stored);
    } catch { /* ignore */ }
  }, []);

  const appendLog = useCallback((dir: Direction, text: string, size?: number) => {
    setLogs((prev) => [
      ...prev,
      { id: ++logIdRef.current, time: Date.now(), dir, text, size },
    ]);
  }, []);

  // Auto-scroll to bottom on new log
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs, autoScroll]);

  const connect = useCallback(() => {
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a WebSocket URL (ws:// or wss://).");
      return;
    }
    if (!/^wss?:\/\//i.test(trimmed)) {
      setError("URL must start with ws:// or wss://");
      return;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
    }
    try {
      const protoArr = protocols.split(",").map((s) => s.trim()).filter(Boolean);
      const ws = protoArr.length ? new WebSocket(trimmed, protoArr) : new WebSocket(trimmed);
      wsRef.current = ws;
      setConn("connecting");
      appendLog("info", `Connecting to ${trimmed}${protoArr.length ? ` (subprotocols: ${protoArr.join(", ")})` : ""}…`);

      ws.onopen = () => {
        setConn("open");
        appendLog("info", `✓ Connected. Protocol: ${ws.protocol || "(none)"}`);
        try { localStorage.setItem(STORAGE_KEY, trimmed); } catch { /* ignore */ }
      };
      ws.onmessage = async (ev) => {
        let text: string;
        let size: number | undefined;
        if (typeof ev.data === "string") {
          text = ev.data;
          size = new Blob([ev.data]).size;
        } else if (ev.data instanceof Blob) {
          size = ev.data.size;
          // Render as text if it looks like text, else as hex preview
          try {
            text = await ev.data.text();
            if (text.length > 5000) text = text.slice(0, 5000) + "…[truncated]";
          } catch {
            text = `[Binary blob ${size} bytes]`;
          }
        } else if (ev.data instanceof ArrayBuffer) {
          size = ev.data.byteLength;
          const bytes = new Uint8Array(ev.data);
          const hex = [...bytes.slice(0, 64)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
          text = `[ArrayBuffer ${size} bytes] ${hex}${size > 64 ? "…" : ""}`;
        } else {
          text = String(ev.data);
        }
        appendLog("in", text, size);
      };
      ws.onerror = () => {
        appendLog("error", "WebSocket error event (browser hides details for security).");
      };
      ws.onclose = (ev) => {
        setConn("closed");
        appendLog("info", `Connection closed. Code: ${ev.code}${ev.reason ? ` · Reason: "${ev.reason}"` : ""}${ev.wasClean ? " (clean)" : " (not clean)"}`);
        wsRef.current = null;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open WebSocket.");
      setConn("idle");
    }
  }, [url, protocols, appendLog]);

  const disconnect = useCallback(() => {
    if (!wsRef.current) return;
    setConn("closing");
    appendLog("info", "Closing connection…");
    try { wsRef.current.close(1000, "user requested"); } catch { /* ignore */ }
  }, [appendLog]);

  const send = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected. Open a connection first.");
      return;
    }
    if (!message) return;
    try {
      wsRef.current.send(message);
      appendLog("out", message, new Blob([message]).size);
    } catch (e) {
      appendLog("error", e instanceof Error ? e.message : "send failed");
    }
  }, [message, appendLog]);

  // Send on ⌘+Enter
  const onMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  };

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      try { wsRef.current?.close(); } catch { /* ignore */ }
    };
  }, []);

  const exportLogs = () => {
    if (logs.length === 0) return;
    const lines = logs.map((l) => {
      const dirLabel = l.dir === "out" ? "→ SENT" : l.dir === "in" ? "← RECV" : l.dir === "error" ? "! ERR " : "· INFO";
      return `[${fmtTime(l.time)}] ${dirLabel}${l.size != null ? ` (${shortenBytes(l.size)})` : ""}\n${l.text}\n`;
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `ws-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(u);
  };

  const stats = {
    sent: logs.filter((l) => l.dir === "out").length,
    received: logs.filter((l) => l.dir === "in").length,
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <ToolPageHero tool={tool} />

      <div className="space-y-4">
        {/* Connection */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Connection</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto]">
            <div>
              <label htmlFor="ws-url" className="mb-1 block text-xs font-medium text-muted-foreground">
                URL
              </label>
              <input
                id="ws-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="wss://echo.example.com"
                spellCheck={false}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div>
              <label htmlFor="ws-protocols" className="mb-1 block text-xs font-medium text-muted-foreground">
                Subprotocols (optional)
              </label>
              <input
                id="ws-protocols"
                type="text"
                value={protocols}
                onChange={(e) => setProtocols(e.target.value)}
                placeholder="graphql-ws, json"
                spellCheck={false}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="flex items-end gap-2">
              {conn === "open" || conn === "connecting" || conn === "closing" ? (
                <button
                  onClick={disconnect}
                  disabled={conn === "closing"}
                  className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-40"
                >
                  <Unplug aria-hidden="true" className="h-4 w-4" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connect}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
                >
                  <Plug aria-hidden="true" className="h-4 w-4" />
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Quick URLs */}
          {!url && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Try:</span>
              {SAMPLE_URLS.map((s) => (
                <button
                  key={s.url}
                  onClick={() => setUrl(s.url)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Status pill */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium ${
                conn === "open"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : conn === "connecting"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : conn === "closing"
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : conn === "closed"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-muted text-muted-foreground"
              }`}
            >
              {conn === "open" ? <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> : <AlertCircle aria-hidden="true" className="h-3 w-3" />}
              {conn}
            </span>
            <span className="text-muted-foreground">↑ {stats.sent} sent · ↓ {stats.received} received</span>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </section>

        {/* Send */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Send a message</h2>
          <label htmlFor="ws-message" className="sr-only">Message to send</label>
          <textarea
            id="ws-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={onMessageKeyDown}
            placeholder='{"type": "ping"} — or any text. ⌘/Ctrl+Enter to send.'
            spellCheck={false}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{new Blob([message]).size} bytes · ⌘+Enter to send</span>
            <button
              onClick={send}
              disabled={!message || conn !== "open"}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              Send
            </button>
          </div>
        </section>

        {/* Log */}
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Frames ({logs.length})</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="h-3.5 w-3.5"
                />
                Auto-scroll
              </label>
              <button
                onClick={exportLogs}
                disabled={logs.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Download aria-hidden="true" className="h-3.5 w-3.5" />
                Export
              </button>
              <button
                onClick={() => setLogs([])}
                disabled={logs.length === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>
          <div
            ref={scrollerRef}
            className="max-h-[420px] min-h-[200px] overflow-auto px-4 py-3 font-mono text-xs"
          >
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground">No frames yet. Connect and send a message.</p>
            ) : (
              <ul className="space-y-1.5">
                {logs.map((l) => (
                  <li
                    key={l.id}
                    className={`rounded-md border px-2.5 py-1.5 ${
                      l.dir === "out"
                        ? "border-blue-500/20 bg-blue-500/5"
                        : l.dir === "in"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : l.dir === "error"
                            ? "border-destructive/30 bg-destructive/5"
                            : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="mb-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-semibold">
                        {l.dir === "out" ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"><ArrowUpFromLine aria-hidden="true" className="h-3 w-3" /> SENT</span>
                        ) : l.dir === "in" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><ArrowDownToLine aria-hidden="true" className="h-3 w-3" /> RECV</span>
                        ) : l.dir === "error" ? (
                          <span className="text-destructive">ERROR</span>
                        ) : (
                          <span>INFO</span>
                        )}
                      </span>
                      <span>{fmtTime(l.time)}</span>
                      {l.size != null && <span>{shortenBytes(l.size)}</span>}
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-foreground/90">{l.text}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <p className="text-xs text-muted-foreground">
          WebSocket connections are made directly from your browser to the target server. Some servers reject browser origins (CORS-like behaviour) — if you see an immediate close with code 1006, that&apos;s usually why.
        </p>
      </div>
    </main>
  );
}
