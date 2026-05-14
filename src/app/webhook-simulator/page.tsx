"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Send,
  Copy,
  Check,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  Shield,
  Clock,
  Webhook,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  PROVIDER_LABELS,
  PROVIDER_DEFAULT_SECRET,
  presetsForProvider,
  presetById,
  type WebhookEventPreset,
} from "@/lib/webhook-presets";
import {
  signWebhook,
  verifyWebhook,
  type HashAlgorithm,
  type Encoding,
  type WebhookProvider,
} from "@/lib/webhook-signatures";
import {
  trackToolSuccess,
  trackToolError,
  trackToolCopy,
} from "@/lib/analytics-events";

const TOOL_SLUG = "webhook-simulator";

type Mode = "generate" | "send" | "verify";
type HeaderRow = { id: string; key: string; value: string };

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function emptyHeader(): HeaderRow {
  return { id: uid(), key: "", value: "" };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  time: number;
  size: number;
  redirected: boolean;
  finalUrl: string;
}

function CopyBtn({
  text,
  what,
  label,
}: {
  text: string;
  what: string;
  label?: string;
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

function statusColor(code: number): string {
  if (code < 300) return "text-success";
  if (code < 400) return "text-warning";
  return "text-destructive";
}

function statusBg(code: number): string {
  if (code < 300) return "bg-success/10 border-success/20";
  if (code < 400) return "bg-warning/10 border-warning/20";
  return "bg-destructive/10 border-destructive/20";
}

// ─── Main ───────────────────────────────────────────────────────────────

export default function WebhookSimulatorPage() {
  const [mode, setMode] = useState<Mode>("generate");
  const [provider, setProvider] = useState<WebhookProvider>("github");
  const [presetIdState, setPresetIdState] = useState<string>("github-push");
  const [payload, setPayload] = useState<string>(presetById("github-push")!.payload);
  const [secret, setSecret] = useState<string>(PROVIDER_DEFAULT_SECRET.github);
  const [timestamp, setTimestamp] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [useCurrentTimestamp, setUseCurrentTimestamp] = useState(true);

  // Generic-provider extras
  const [genericAlgo, setGenericAlgo] = useState<HashAlgorithm>("SHA-256");
  const [genericEncoding, setGenericEncoding] = useState<Encoding>("hex");
  const [genericHeader, setGenericHeader] = useState<string>("X-Signature");
  const [genericPrefix, setGenericPrefix] = useState<string>("");

  // Computed signed headers (async — runs in effect)
  const [signed, setSigned] = useState<{
    headers: Record<string, string>;
    signature: string;
    signedPayload: string;
  } | null>(null);
  const [signError, setSignError] = useState<string>("");

  // Send mode
  const [targetUrl, setTargetUrl] = useState("");
  const [customHeaders, setCustomHeaders] = useState<HeaderRow[]>([emptyHeader()]);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [sendError, setSendError] = useState<string>("");

  // Verify mode
  const [verifySigInput, setVerifySigInput] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    expected: string;
    actual: string;
    reason?: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Switch provider → snap to first preset of that provider + sensible secret.
  const onProviderChange = useCallback((p: WebhookProvider) => {
    setProvider(p);
    const first = presetsForProvider(p)[0];
    if (first) {
      setPresetIdState(first.id);
      setPayload(first.payload);
    }
    setSecret(PROVIDER_DEFAULT_SECRET[p]);
  }, []);

  // Switch preset → swap payload.
  const onPresetChange = useCallback((id: string) => {
    setPresetIdState(id);
    const p = presetById(id);
    if (p) setPayload(p.payload);
  }, []);

  const currentPreset = useMemo<WebhookEventPreset | undefined>(
    () => presetById(presetIdState),
    [presetIdState],
  );

  // Drive timestamp from "now" while the auto checkbox is on.
  useEffect(() => {
    if (!useCurrentTimestamp) return;
    const tick = () => setTimestamp(Math.floor(Date.now() / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [useCurrentTimestamp]);

  // Re-sign whenever an input changes. Effect (not memo) because WebCrypto is async.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const result = await signWebhook({
          provider,
          body: payload,
          secret,
          timestamp,
          eventType: currentPreset?.eventType,
          generic:
            provider === "generic"
              ? {
                  algorithm: genericAlgo,
                  encoding: genericEncoding,
                  headerName: genericHeader || "X-Signature",
                  prefix: genericPrefix || undefined,
                }
              : undefined,
        });
        if (cancelled) return;
        setSigned({
          headers: result.headers,
          signature: result.signature,
          signedPayload: result.signedPayload,
        });
        setSignError("");
      } catch (e) {
        if (cancelled) return;
        setSignError(e instanceof Error ? e.message : "Could not sign payload");
        setSigned(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [
    provider,
    payload,
    secret,
    timestamp,
    currentPreset,
    genericAlgo,
    genericEncoding,
    genericHeader,
    genericPrefix,
  ]);

  // ─── Generate-tab outputs ─────────────────────────────────────────────

  const signedHeadersText = useMemo(() => {
    if (!signed) return "";
    return Object.entries(signed.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }, [signed]);

  const curlCommand = useMemo(() => {
    if (!signed) return "";
    const url = targetUrl || "https://your-endpoint.example.com/webhook";
    const headerFlags = Object.entries(signed.headers)
      .map(([k, v]) => `  -H "${k}: ${v.replace(/"/g, '\\"')}"`)
      .join(" \\\n");
    const escapedBody = payload.replace(/'/g, "'\\''");
    return `curl -X POST "${url}" \\\n${headerFlags} \\\n  --data-raw '${escapedBody}'`;
  }, [signed, payload, targetUrl]);

  // ─── Send mode ────────────────────────────────────────────────────────

  const mergedHeaders = useMemo(() => {
    const out: Record<string, string> = { ...(signed?.headers ?? {}) };
    for (const h of customHeaders) {
      const k = h.key.trim();
      if (k) out[k] = h.value;
    }
    return out;
  }, [signed, customHeaders]);

  const handleSend = useCallback(async () => {
    setSendError("");
    setResponse(null);
    if (!targetUrl.trim()) {
      setSendError("Enter a target URL first.");
      return;
    }
    if (!signed) {
      setSendError("Payload could not be signed — fix the JSON or secret first.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl.trim(),
          method: "POST",
          headers: mergedHeaders,
          payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error ?? `Proxy returned ${res.status}`);
        trackToolError(TOOL_SLUG, "send", data.error);
      } else {
        setResponse(data as ProxyResponse);
        trackToolSuccess(TOOL_SLUG, "send", {
          provider,
          preset: presetIdState,
          status: (data as ProxyResponse).status,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setSendError(msg);
      trackToolError(TOOL_SLUG, "send", msg);
    } finally {
      setSending(false);
    }
  }, [targetUrl, signed, mergedHeaders, payload, provider, presetIdState]);

  // ─── Verify mode ──────────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyWebhook({
        provider,
        body: payload,
        secret,
        signature: verifySigInput.trim(),
        timestamp,
        generic:
          provider === "generic"
            ? {
                algorithm: genericAlgo,
                encoding: genericEncoding,
                headerName: genericHeader || "X-Signature",
                prefix: genericPrefix || undefined,
              }
            : undefined,
      });
      setVerifyResult(result);
      if (result.valid) {
        trackToolSuccess(TOOL_SLUG, "verify", { provider });
      } else {
        trackToolError(TOOL_SLUG, "verify", result.reason ?? "mismatch");
      }
    } finally {
      setVerifying(false);
    }
  }, [
    provider,
    payload,
    secret,
    verifySigInput,
    timestamp,
    genericAlgo,
    genericEncoding,
    genericHeader,
    genericPrefix,
  ]);

  // ─── UX helpers ───────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    onProviderChange("github");
    setVerifySigInput("");
    setVerifyResult(null);
    setResponse(null);
    setSendError("");
    setTargetUrl("");
    setCustomHeaders([emptyHeader()]);
    setUseCurrentTimestamp(true);
  }, [onProviderChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (mode === "send" && !sending) handleSend();
        else if (mode === "verify" && !verifying) handleVerify();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, sending, verifying, handleSend, handleVerify]);

  const showsTimestamp = provider === "stripe" || provider === "slack";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
          {/* Hero */}
          <header className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Webhook Payload Simulator
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                <Shield className="w-3 h-3" aria-hidden="true" />
                Secret stays in your browser
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Generate signed GitHub, Stripe, Slack, and Shopify webhook payloads — or bring your own
              with a generic HMAC. Send them to your endpoint, or verify a real signature against a
              secret. All signing runs locally via WebCrypto.
            </p>
          </header>

          {/* Mode tabs */}
          <div className="flex border-b border-border mb-5">
            {(
              [
                ["generate", "Generate", Webhook],
                ["send", "Send", Send],
                ["verify", "Verify", ShieldCheck],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  mode === id
                    ? "text-foreground border-b-2 border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                role="tab"
                aria-selected={mode === id}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ─── LEFT: provider, preset, payload, secret ─── */}
            <div className="flex flex-col gap-5 min-w-0">
              <ProviderPicker value={provider} onChange={onProviderChange} />

              {provider !== "generic" && (
                <PresetPicker
                  provider={provider}
                  value={presetIdState}
                  onChange={onPresetChange}
                />
              )}

              {/* Payload */}
              <section className="flex flex-col border border-border rounded-xl bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Payload (JSON)
                  </span>
                  <CopyBtn text={payload} what="payload" />
                </div>
                <textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  spellCheck={false}
                  className="w-full h-72 px-3 py-2.5 text-[13px] font-mono leading-relaxed bg-background resize-y focus:outline-none placeholder:text-muted-foreground/40"
                  placeholder='{ "event": "...", "data": { ... } }'
                />
              </section>

              {/* Secret + timestamp + generic config */}
              <section className="border border-border rounded-xl bg-card p-3 space-y-3">
                <label className="block">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Secret
                  </span>
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                  />
                  <span className="block mt-1 text-[11px] text-muted-foreground">
                    Used to compute the HMAC. Never sent to DevBench servers.
                  </span>
                </label>

                {showsTimestamp && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Timestamp (unix seconds)
                      </span>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCurrentTimestamp}
                          onChange={(e) => setUseCurrentTimestamp(e.target.checked)}
                          className="rounded"
                        />
                        Use current time
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={timestamp}
                        onChange={(e) => {
                          setUseCurrentTimestamp(false);
                          setTimestamp(Number(e.target.value));
                        }}
                        disabled={useCurrentTimestamp}
                        className="flex-1 px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40 disabled:opacity-60"
                      />
                      <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(timestamp * 1000).toISOString().slice(0, 19)}Z
                      </span>
                    </div>
                  </div>
                )}

                {provider === "generic" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="text-xs">
                      <span className="block text-muted-foreground mb-1">Algorithm</span>
                      <select
                        value={genericAlgo}
                        onChange={(e) => setGenericAlgo(e.target.value as HashAlgorithm)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none"
                      >
                        <option value="SHA-1">HMAC-SHA1</option>
                        <option value="SHA-256">HMAC-SHA256</option>
                        <option value="SHA-512">HMAC-SHA512</option>
                      </select>
                    </label>
                    <label className="text-xs">
                      <span className="block text-muted-foreground mb-1">Encoding</span>
                      <select
                        value={genericEncoding}
                        onChange={(e) => setGenericEncoding(e.target.value as Encoding)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none"
                      >
                        <option value="hex">Hex</option>
                        <option value="base64">Base64</option>
                      </select>
                    </label>
                    <label className="text-xs col-span-2">
                      <span className="block text-muted-foreground mb-1">Header name</span>
                      <input
                        value={genericHeader}
                        onChange={(e) => setGenericHeader(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                      />
                    </label>
                    <label className="text-xs col-span-2">
                      <span className="block text-muted-foreground mb-1">Signature prefix (optional)</span>
                      <input
                        value={genericPrefix}
                        onChange={(e) => setGenericPrefix(e.target.value)}
                        placeholder='e.g. "sha256="'
                        className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
                      />
                    </label>
                  </div>
                )}
              </section>

              {signError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{signError}</span>
                </div>
              )}
            </div>

            {/* ─── RIGHT: mode-specific output ─── */}
            <div className="flex flex-col gap-5 min-w-0">
              {mode === "generate" && (
                <GenerateOutput
                  signed={signed}
                  signedHeadersText={signedHeadersText}
                  curl={curlCommand}
                  onSwitchToSend={() => setMode("send")}
                />
              )}

              {mode === "send" && (
                <SendOutput
                  targetUrl={targetUrl}
                  onTargetUrlChange={setTargetUrl}
                  customHeaders={customHeaders}
                  onCustomHeadersChange={setCustomHeaders}
                  mergedHeaders={mergedHeaders}
                  onSend={handleSend}
                  sending={sending}
                  response={response}
                  error={sendError}
                  signed={!!signed}
                />
              )}

              {mode === "verify" && (
                <VerifyOutput
                  signatureInput={verifySigInput}
                  onSignatureInputChange={setVerifySigInput}
                  onVerify={handleVerify}
                  verifying={verifying}
                  result={verifyResult}
                  provider={provider}
                />
              )}

              <button
                type="button"
                onClick={handleReset}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reset workspace
              </button>
            </div>
          </div>

          <footer className="mt-8 text-xs text-muted-foreground max-w-3xl space-y-1.5">
            <p className="leading-relaxed">
              <strong className="text-foreground">Privacy:</strong> Your secret is used only inside
              this browser tab. The signed payload is posted directly from this page; nothing about
              the signing is recorded by DevBench.
            </p>
            <p className="leading-relaxed">
              <strong className="text-foreground">Local endpoints:</strong> the Send proxy blocks
              private addresses (RFC 1918, loopback). To test a localhost receiver, tunnel it via
              ngrok / cloudflared, or use the <em>Copy as cURL</em> button on the Generate tab.
            </p>
          </footer>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Provider + preset pickers ─────────────────────────────────────────

function ProviderPicker({
  value,
  onChange,
}: {
  value: WebhookProvider;
  onChange: (p: WebhookProvider) => void;
}) {
  const providers: WebhookProvider[] = ["github", "stripe", "slack", "shopify", "generic"];
  return (
    <div className="grid grid-cols-5 gap-1.5 border border-border rounded-xl bg-card p-1.5">
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === p
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          aria-pressed={value === p}
        >
          {PROVIDER_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

function PresetPicker({
  provider,
  value,
  onChange,
}: {
  provider: WebhookProvider;
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

  const items = useMemo(() => presetsForProvider(provider), [provider]);
  const current = presetById(value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-card hover:bg-muted transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate font-medium">{current?.label ?? "Choose event"}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-background shadow-lg"
        >
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
      )}
    </div>
  );
}

// ─── Generate tab ───────────────────────────────────────────────────────

function GenerateOutput({
  signed,
  signedHeadersText,
  curl,
  onSwitchToSend,
}: {
  signed: { headers: Record<string, string>; signature: string; signedPayload: string } | null;
  signedHeadersText: string;
  curl: string;
  onSwitchToSend: () => void;
}) {
  return (
    <>
      <section className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Signed headers
          </span>
          <div className="flex items-center gap-1.5">
            <CopyBtn text={signedHeadersText} what="headers" />
            <button
              type="button"
              onClick={onSwitchToSend}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <Send className="w-3 h-3" aria-hidden="true" /> Send
            </button>
          </div>
        </div>
        <pre className="px-3 py-2.5 text-[13px] font-mono leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-auto">
          {signedHeadersText || "—"}
        </pre>
      </section>

      <section className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Signature
          </span>
          <CopyBtn text={signed?.signature ?? ""} what="signature" />
        </div>
        <pre className="px-3 py-2.5 text-[12.5px] font-mono leading-relaxed break-all">
          {signed?.signature || "—"}
        </pre>
      </section>

      <section className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Copy as cURL
          </span>
          <CopyBtn text={curl} what="curl" />
        </div>
        <pre className="px-3 py-2.5 text-[12.5px] font-mono leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-auto">
          {curl}
        </pre>
      </section>
    </>
  );
}

// ─── Send tab ───────────────────────────────────────────────────────────

function SendOutput({
  targetUrl,
  onTargetUrlChange,
  customHeaders,
  onCustomHeadersChange,
  mergedHeaders,
  onSend,
  sending,
  response,
  error,
  signed,
}: {
  targetUrl: string;
  onTargetUrlChange: (v: string) => void;
  customHeaders: HeaderRow[];
  onCustomHeadersChange: (rows: HeaderRow[]) => void;
  mergedHeaders: Record<string, string>;
  onSend: () => void;
  sending: boolean;
  response: ProxyResponse | null;
  error: string;
  signed: boolean;
}) {
  return (
    <>
      <section className="border border-border rounded-xl bg-card p-3 space-y-3">
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Target URL
          </span>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => onTargetUrlChange(e.target.value)}
            placeholder="https://your-endpoint.example.com/webhook"
            spellCheck={false}
            className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[13px] focus:outline-none focus:ring-1 focus:ring-ring/40"
          />
        </label>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Extra headers
            </span>
            <button
              type="button"
              onClick={() => onCustomHeadersChange([...customHeaders, emptyHeader()])}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="w-3 h-3" aria-hidden="true" /> Add
            </button>
          </div>
          <div className="space-y-1.5">
            {customHeaders.map((h) => (
              <div key={h.id} className="flex items-center gap-1.5">
                <input
                  value={h.key}
                  onChange={(e) =>
                    onCustomHeadersChange(
                      customHeaders.map((r) => (r.id === h.id ? { ...r, key: e.target.value } : r)),
                    )
                  }
                  placeholder="Header name"
                  className="flex-1 px-2.5 py-1.5 text-[13px] font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring/40"
                />
                <input
                  value={h.value}
                  onChange={(e) =>
                    onCustomHeadersChange(
                      customHeaders.map((r) => (r.id === h.id ? { ...r, value: e.target.value } : r)),
                    )
                  }
                  placeholder="value"
                  className="flex-1 px-2.5 py-1.5 text-[13px] font-mono rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring/40"
                />
                <button
                  type="button"
                  onClick={() =>
                    onCustomHeadersChange(
                      customHeaders.length === 1
                        ? [emptyHeader()]
                        : customHeaders.filter((r) => r.id !== h.id),
                    )
                  }
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label="Remove header"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            All headers ({Object.keys(mergedHeaders).length})
          </span>
          <pre className="px-3 py-2 max-h-40 overflow-auto text-[12.5px] font-mono leading-relaxed bg-muted/30 rounded-md border border-border whitespace-pre-wrap break-words">
            {Object.entries(mergedHeaders)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n") || "—"}
          </pre>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={sending || !signed}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
          {sending ? "Sending…" : "Send webhook"}
          <kbd className="hidden sm:inline text-[10px] font-mono opacity-70 ml-1">⌘↵</kbd>
        </button>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {response && (
        <section
          className={`rounded-xl border ${statusBg(response.status)} overflow-hidden`}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`font-bold ${statusColor(response.status)}`}>
                {response.status}
              </span>
              <span className="text-muted-foreground">{response.statusText}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" /> {response.time} ms
              </span>
              <span>{formatBytes(response.size)}</span>
            </div>
          </div>
          <pre className="px-3 py-2.5 text-[12.5px] font-mono leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-auto">
            {response.body || "(empty body)"}
          </pre>
        </section>
      )}
    </>
  );
}

// ─── Verify tab ─────────────────────────────────────────────────────────

function VerifyOutput({
  signatureInput,
  onSignatureInputChange,
  onVerify,
  verifying,
  result,
  provider,
}: {
  signatureInput: string;
  onSignatureInputChange: (v: string) => void;
  onVerify: () => void;
  verifying: boolean;
  result: {
    valid: boolean;
    expected: string;
    actual: string;
    reason?: string;
  } | null;
  provider: WebhookProvider;
}) {
  const placeholder =
    provider === "github"
      ? "sha256=abc123..."
      : provider === "stripe"
      ? "t=1741774530,v1=abc123..."
      : provider === "slack"
      ? "v0=abc123..."
      : provider === "shopify"
      ? "base64-encoded-hmac"
      : "your raw signature value";

  return (
    <>
      <section className="border border-border rounded-xl bg-card p-3 space-y-3">
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Signature header value
          </span>
          <textarea
            value={signatureInput}
            onChange={(e) => onSignatureInputChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className="w-full h-24 px-2.5 py-1.5 rounded-md border border-border bg-background font-mono text-[12.5px] focus:outline-none focus:ring-1 focus:ring-ring/40 resize-y"
          />
          <span className="block mt-1 text-[11px] text-muted-foreground">
            Paste the exact value from the request header. Provider-specific prefixes (e.g. <code className="px-1 rounded bg-muted">sha256=</code>) are accepted.
          </span>
        </label>

        <button
          type="button"
          onClick={onVerify}
          disabled={verifying || !signatureInput.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {verifying ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          )}
          {verifying ? "Verifying…" : "Verify signature"}
          <kbd className="hidden sm:inline text-[10px] font-mono opacity-70 ml-1">⌘↵</kbd>
        </button>
      </section>

      {result && (
        <section
          className={`rounded-xl border px-3 py-3 ${
            result.valid
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-destructive/30 bg-destructive/5"
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold mb-3">
            {result.valid ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                <span className="text-emerald-600 dark:text-emerald-400">Signature valid</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 text-destructive" aria-hidden="true" />
                <span className="text-destructive">Signature does NOT match</span>
              </>
            )}
          </div>
          {result.reason && (
            <p className="mb-3 text-xs text-muted-foreground">{result.reason}</p>
          )}
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-[12.5px] font-mono">
            <dt className="text-muted-foreground">Expected</dt>
            <dd className="break-all">{result.expected || "—"}</dd>
            <dt className="text-muted-foreground">Provided</dt>
            <dd className="break-all">{result.actual || "—"}</dd>
          </dl>
        </section>
      )}
    </>
  );
}
