"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Send,
  Copy,
  Check,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Clock,
  Server,
  FileText,
  Code2,
  Shield,
  Loader2,
  AlertCircle,
  Globe,
  Lock,
  Braces,
  Radio,
  Unplug,
  PlugZap,
  Share2,
  Workflow,
} from "lucide-react";
import { io, type Socket as IoSocket } from "socket.io-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  trackToolSuccess,
  trackToolError,
} from "@/lib/analytics-events";

const TOOL_SLUG = "api-tester";

// ─── types ────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type BodyType = "none" | "json" | "form" | "xml" | "raw";
type AuthType = "none" | "bearer" | "basic" | "custom";
type RequestTab =
  | "params"
  | "body"
  | "auth"
  | "headers"
  | "subprotocols"
  | "graphqlOp"
  | "graphqlVars"
  | "grpcJson"
  | "socketioOpts";
type ResponseTab = "body" | "headers" | "raw" | "timing" | "code";
type TransportMode = "http" | "websocket" | "socketio" | "graphql" | "grpc";
type WsConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error";

interface WsLogEntry {
  id: string;
  t: number;
  kind: "sent" | "received" | "system";
  text: string;
}

interface KVPair { key: string; value: string; enabled: boolean; id: string }
interface ApiResponse {
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

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "text-emerald-500",
  POST: "text-amber-500",
  PUT: "text-blue-500",
  PATCH: "text-violet-500",
  DELETE: "text-red-500",
  HEAD: "text-cyan-500",
  OPTIONS: "text-pink-500",
};

const METHOD_BG: Record<HttpMethod, string> = {
  GET: "bg-emerald-500",
  POST: "bg-amber-500",
  PUT: "bg-blue-500",
  PATCH: "bg-violet-500",
  DELETE: "bg-red-500",
  HEAD: "bg-cyan-500",
  OPTIONS: "bg-pink-500",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyKV(): KVPair {
  return { key: "", value: "", enabled: true, id: uid() };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
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

function tryFormatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function tryFormatXml(text: string): string {
  try {
    let formatted = "";
    let indent = 0;
    const parts = text.replace(/>\s*</g, ">\n<").split("\n");
    for (const part of parts) {
      if (part.match(/^<\/\w/)) indent--;
      formatted += "  ".repeat(Math.max(0, indent)) + part.trim() + "\n";
      if (part.match(/^<\w[^>]*[^/]>$/)) indent++;
    }
    return formatted.trim();
  } catch {
    return text;
  }
}

function generateCodeSnippet(
  lang: string,
  method: HttpMethod,
  url: string,
  headers: Record<string, string>,
  body?: string
): string {
  const hasBody = body && !["GET", "HEAD"].includes(method);
  const headerEntries = Object.entries(headers).filter(([k]) => k.trim());

  switch (lang) {
    case "curl": {
      let cmd = `curl -X ${method} "${url}"`;
      for (const [k, v] of headerEntries) cmd += ` \\\n  -H "${k}: ${v}"`;
      if (hasBody) cmd += ` \\\n  -d '${body}'`;
      return cmd;
    }
    case "javascript": {
      let code = `const response = await fetch("${url}", {\n  method: "${method}",\n`;
      if (headerEntries.length) {
        code += `  headers: {\n${headerEntries.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  },\n`;
      }
      if (hasBody) code += `  body: ${JSON.stringify(body)},\n`;
      code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
      return code;
    }
    case "python": {
      let code = `import requests\n\nresponse = requests.${method.toLowerCase()}(\n  "${url}",\n`;
      if (headerEntries.length) {
        code += `  headers={\n${headerEntries.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  },\n`;
      }
      if (hasBody) code += `  data='${body}',\n`;
      code += `)\n\nprint(response.status_code)\nprint(response.json())`;
      return code;
    }
    case "php": {
      let code = `<?php\n$ch = curl_init();\n\ncurl_setopt($ch, CURLOPT_URL, "${url}");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\n`;
      if (headerEntries.length) {
        code += `\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n${headerEntries.map(([k, v]) => `  "${k}: ${v}"`).join(",\n")}\n]);\n`;
      }
      if (hasBody) code += `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${body}');\n`;
      code += `\n$response = curl_exec($ch);\n$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);\ncurl_close($ch);\n\necho $httpCode . "\\n";\necho $response;`;
      return code;
    }
    case "node": {
      let code = `const https = require('https');\nconst url = new URL("${url}");\n\nconst options = {\n  hostname: url.hostname,\n  path: url.pathname + url.search,\n  method: "${method}",\n`;
      if (headerEntries.length) {
        code += `  headers: {\n${headerEntries.map(([k, v]) => `    "${k}": "${v}"`).join(",\n")}\n  },\n`;
      }
      code += `};\n\nconst req = https.request(options, (res) => {\n  let data = "";\n  res.on("data", (chunk) => data += chunk);\n  res.on("end", () => console.log(res.statusCode, data));\n});\n`;
      if (hasBody) code += `\nreq.write('${body}');\n`;
      code += `req.end();`;
      return code;
    }
    case "java": {
      let code = `import java.net.http.*;\nimport java.net.URI;\n\nvar client = HttpClient.newHttpClient();\nvar request = HttpRequest.newBuilder()\n  .uri(URI.create("${url}"))\n  .method("${method}", `;
      if (hasBody) {
        code += `HttpRequest.BodyPublishers.ofString("${body?.replace(/"/g, '\\"')}"))\n`;
      } else {
        code += `HttpRequest.BodyPublishers.noBody())\n`;
      }
      for (const [k, v] of headerEntries) code += `  .header("${k}", "${v}")\n`;
      code += `  .build();\n\nvar response = client.send(request, HttpResponse.BodyHandlers.ofString());\nSystem.out.println(response.statusCode());\nSystem.out.println(response.body());`;
      return code;
    }
    case "csharp": {
      let code = `using var client = new HttpClient();\n\nvar request = new HttpRequestMessage(HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()}, "${url}");\n`;
      for (const [k, v] of headerEntries) code += `request.Headers.Add("${k}", "${v}");\n`;
      if (hasBody) code += `request.Content = new StringContent("${body?.replace(/"/g, '\\"')}");\n`;
      code += `\nvar response = await client.SendAsync(request);\nvar body = await response.Content.ReadAsStringAsync();\nConsole.WriteLine($"{(int)response.StatusCode} {response.StatusCode}");\nConsole.WriteLine(body);`;
      return code;
    }
    default:
      return "";
  }
}

// ─── CopyBtn ──────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {label || (copied ? "Copied" : "Copy")}
    </button>
  );
}

// ─── KV Table ─────────────────────────────────────────────────────────

function KVTable({
  pairs,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const update = (id: string, field: keyof KVPair, val: string | boolean) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };
  const remove = (id: string) => onChange(pairs.filter((p) => p.id !== id));
  const add = () => onChange([...pairs, emptyKV()]);

  return (
    <div className="space-y-1.5">
      {pairs.map((p) => (
        <div key={p.id} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={p.enabled}
            onChange={(e) => update(p.id, "enabled", e.target.checked)}
            className="rounded shrink-0"
          />
          <input
            type="text"
            value={p.key}
            onChange={(e) => update(p.id, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring/40 placeholder:text-muted-foreground/40"
          />
          <input
            type="text"
            value={p.value}
            onChange={(e) => update(p.id, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring/40 placeholder:text-muted-foreground/40"
          />
          <button onClick={() => remove(p.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-xs text-accent hover:underline mt-1">
        <Plus className="w-3 h-3" /> Add
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────

export default function ApiTesterPage() {
  const [transportMode, setTransportMode] = useState<TransportMode>("http");

  // Request state
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [reqTab, setReqTab] = useState<RequestTab>("params");
  const [params, setParams] = useState<KVPair[]>([emptyKV()]);
  const [bodyType, setBodyType] = useState<BodyType>("none");
  const [bodyContent, setBodyContent] = useState('{\n  "key": "value"\n}');
  const [authType, setAuthType] = useState<AuthType>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUser, setBasicUser] = useState("");
  const [basicPass, setBasicPass] = useState("");
  const [customAuth, setCustomAuth] = useState("");
  const [customHeaders, setCustomHeaders] = useState<KVPair[]>([emptyKV()]);

  // Response state
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [resError, setResError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resTab, setResTab] = useState<ResponseTab>("body");
  const [codeLang, setCodeLang] = useState("curl");

  // History
  const [history, setHistory] = useState<{ method: HttpMethod; url: string; status: number; time: number }[]>([]);
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const methodRef = useRef<HTMLDivElement>(null);

  // WebSocket (browser connects directly — not via HTTP proxy)
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>("idle");
  const [wsLog, setWsLog] = useState<WsLogEntry[]>([]);
  const [wsOutgoing, setWsOutgoing] = useState("");
  const [wsSubprotocols, setWsSubprotocols] = useState("");

  const [graphqlQuery, setGraphqlQuery] = useState("query {\n  __typename\n}");
  const [graphqlVariables, setGraphqlVariables] = useState("{}");
  const [graphqlOpName, setGraphqlOpName] = useState("");
  const [grpcJsonBody, setGrpcJsonBody] = useState("{}");

  const socketIoRef = useRef<IoSocket | null>(null);
  const [socketIoStatus, setSocketIoStatus] = useState<WsConnectionStatus>("idle");
  const [socketIoLog, setSocketIoLog] = useState<WsLogEntry[]>([]);
  const [socketIoOutgoing, setSocketIoOutgoing] = useState("");
  const [socketIoEvent, setSocketIoEvent] = useState("message");
  const [socketIoPath, setSocketIoPath] = useState("/socket.io");
  const [socketIoAuthJson, setSocketIoAuthJson] = useState("{}");
  const [socketIoPollingOnly, setSocketIoPollingOnly] = useState(false);

  const pushSocketIoLog = useCallback((kind: WsLogEntry["kind"], text: string) => {
    setSocketIoLog((prev) => [...prev, { id: uid(), t: Date.now(), kind, text }]);
  }, []);

  useEffect(() => {
    return () => {
      socketIoRef.current?.disconnect();
      socketIoRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (transportMode !== "socketio") {
      socketIoRef.current?.disconnect();
      socketIoRef.current = null;
      setSocketIoStatus("idle");
    }
  }, [transportMode]);

  useEffect(() => {
    if (transportMode === "graphql") setReqTab("graphqlOp");
    else if (transportMode === "grpc") setReqTab("grpcJson");
    else setReqTab("params");
  }, [transportMode]);

  const pushWsLog = useCallback((kind: WsLogEntry["kind"], text: string) => {
    setWsLog((prev) => [...prev, { id: uid(), t: Date.now(), kind, text }]);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (transportMode !== "websocket") {
      wsRef.current?.close();
      wsRef.current = null;
      setWsStatus("idle");
    }
  }, [transportMode]);

  const wsTargetUrl = useMemo(() => {
    if (!url.trim()) return "";
    try {
      let raw = url.trim();
      if (!/^wss?:\/\//i.test(raw)) {
        if (/^https:\/\//i.test(raw)) raw = `wss://${raw.slice(8)}`;
        else if (/^http:\/\//i.test(raw)) raw = `ws://${raw.slice(7)}`;
        else raw = `wss://${raw}`;
      }
      const u = new URL(raw);
      params.filter((p) => p.enabled && p.key.trim()).forEach((p) => u.searchParams.set(p.key, p.value));
      return u.toString();
    } catch {
      return "";
    }
  }, [url, params]);

  const connectWebSocket = useCallback(() => {
    if (!wsTargetUrl) return;
    wsRef.current?.close();
    setWsLog([]);
    setWsStatus("connecting");
    pushWsLog("system", `Connecting to ${wsTargetUrl}…`);

    try {
      const protocols = wsSubprotocols
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const ws =
        protocols.length > 0 ? new WebSocket(wsTargetUrl, protocols) : new WebSocket(wsTargetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("open");
        pushWsLog("system", "Connected.");
      };
      ws.onclose = (ev) => {
        setWsStatus("closed");
        pushWsLog(
          "system",
          `Closed (code ${ev.code}${ev.reason ? `: ${ev.reason}` : ""}${ev.wasClean ? ", clean" : ""}).`
        );
        if (wsRef.current === ws) wsRef.current = null;
      };
      ws.onerror = () => {
        setWsStatus("error");
        pushWsLog("system", "WebSocket error (check URL, TLS, and mixed content: HTTPS pages require wss://).");
      };
      ws.onmessage = (ev) => {
        let text: string;
        if (typeof ev.data === "string") text = ev.data;
        else if (ev.data instanceof ArrayBuffer)
          text = `[binary ${ev.data.byteLength} bytes]`;
        else if (ev.data instanceof Blob) text = `[blob ${ev.data.size} bytes]`;
        else text = String(ev.data);
        pushWsLog("received", text);
      };
    } catch (e) {
      setWsStatus("error");
      pushWsLog("system", e instanceof Error ? e.message : "Failed to open WebSocket.");
    }
  }, [wsTargetUrl, wsSubprotocols, pushWsLog]);

  const disconnectWebSocket = useCallback(() => {
    wsRef.current?.close(1000, "Closed by user");
  }, []);

  const sendWebSocketMessage = useCallback(() => {
    const msg = wsOutgoing;
    if (!msg || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(msg);
    pushWsLog("sent", msg);
    setWsOutgoing("");
  }, [wsOutgoing, pushWsLog]);

  // Build final URL with query params
  const finalUrl = useMemo(() => {
    if (!url.trim()) return "";
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      params.filter((p) => p.enabled && p.key.trim()).forEach((p) => u.searchParams.set(p.key, p.value));
      return u.toString();
    } catch {
      return url;
    }
  }, [url, params]);

  // Build headers
  const buildHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    customHeaders.filter((p) => p.enabled && p.key.trim()).forEach((p) => { h[p.key] = p.value; });

    if (bodyType === "json" && !h["Content-Type"]) h["Content-Type"] = "application/json";
    if (bodyType === "form" && !h["Content-Type"]) h["Content-Type"] = "application/x-www-form-urlencoded";
    if (bodyType === "xml" && !h["Content-Type"]) h["Content-Type"] = "application/xml";

    if (authType === "bearer" && bearerToken.trim()) h["Authorization"] = `Bearer ${bearerToken}`;
    if (authType === "basic" && basicUser.trim()) h["Authorization"] = `Basic ${btoa(`${basicUser}:${basicPass}`)}`;
    if (authType === "custom" && customAuth.trim()) h["Authorization"] = customAuth;

    return h;
  }, [customHeaders, bodyType, authType, bearerToken, basicUser, basicPass, customAuth]);

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResError("");
    setResponse(null);
    setResTab("body");

    try {
      const headers = buildHeaders();
      const payload = bodyType !== "none" && !["GET", "HEAD"].includes(method) ? bodyContent : undefined;

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl, method, headers, payload }),
      });

      const data = await res.json();

      if (data.error) {
        setResError(data.error);
        trackToolError(TOOL_SLUG, "send_rest", data.error);
      } else {
        setResponse(data);
        setHistory((h) => [{ method, url: finalUrl, status: data.status, time: data.time }, ...h.slice(0, 19)]);
        trackToolSuccess(TOOL_SLUG, "send_rest", { method, status: data.status });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setResError(msg);
      trackToolError(TOOL_SLUG, "send_rest", msg);
    } finally {
      setLoading(false);
    }
  }, [url, method, finalUrl, bodyType, bodyContent, buildHeaders]);

  const sendGraphQLRequest = useCallback(async () => {
    if (!finalUrl.trim()) return;
    setLoading(true);
    setResError("");
    setResponse(null);
    setResTab("body");
    try {
      let variables: Record<string, unknown> = {};
      try {
        variables = JSON.parse(graphqlVariables.trim() || "{}") as Record<string, unknown>;
      } catch {
        setResError("Variables must be valid JSON.");
        setLoading(false);
        return;
      }
      const headers = buildHeaders();
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      const payloadObj: { query: string; variables: Record<string, unknown>; operationName?: string } = {
        query: graphqlQuery,
        variables,
      };
      const on = graphqlOpName.trim();
      if (on) payloadObj.operationName = on;
      const payload = JSON.stringify(payloadObj);

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl, method: "POST", headers, payload }),
      });
      const data = await res.json();
      if (data.error) setResError(data.error);
      else {
        setResponse(data);
        setHistory((h) => [{ method: "POST", url: finalUrl, status: data.status, time: data.time }, ...h.slice(0, 19)]);
      }
    } catch (e) {
      setResError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [finalUrl, graphqlQuery, graphqlVariables, graphqlOpName, buildHeaders]);

  const sendGrpcJsonRequest = useCallback(async () => {
    if (!finalUrl.trim()) return;
    setLoading(true);
    setResError("");
    setResponse(null);
    setResTab("body");
    try {
      JSON.parse(grpcJsonBody);
      const headers = buildHeaders();
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl, method: "POST", headers, payload: grpcJsonBody }),
      });
      const data = await res.json();
      if (data.error) setResError(data.error);
      else {
        setResponse(data);
        setHistory((h) => [{ method: "POST", url: finalUrl, status: data.status, time: data.time }, ...h.slice(0, 19)]);
      }
    } catch {
      setResError("Message body must be valid JSON (typical for gRPC-Gateway / gRPC JSON transcoding).");
    } finally {
      setLoading(false);
    }
  }, [finalUrl, grpcJsonBody, buildHeaders]);

  const connectSocketIo = useCallback(() => {
    if (!finalUrl.trim()) return;
    socketIoRef.current?.disconnect();
    setSocketIoLog([]);
    setSocketIoStatus("connecting");
    pushSocketIoLog("system", `Connecting (Socket.IO) to ${finalUrl}…`);

    let auth: Record<string, unknown> | undefined;
    try {
      const raw = socketIoAuthJson.trim();
      if (raw && raw !== "{}") auth = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      setSocketIoStatus("error");
      pushSocketIoLog("system", "Handshake auth must be valid JSON (object) or empty {}.");
      return;
    }

    try {
      const path = socketIoPath.startsWith("/") ? socketIoPath : `/${socketIoPath}`;
      const socket = io(finalUrl, {
        path,
        transports: socketIoPollingOnly ? ["polling"] : ["polling", "websocket"],
        auth,
        autoConnect: true,
        reconnection: false,
      });
      socketIoRef.current = socket;

      socket.on("connect", () => {
        setSocketIoStatus("open");
        pushSocketIoLog("system", `Connected (id: ${socket.id}).`);
      });
      socket.on("disconnect", (reason) => {
        setSocketIoStatus("closed");
        pushSocketIoLog("system", `Disconnected: ${reason}`);
        if (socketIoRef.current === socket) socketIoRef.current = null;
      });
      socket.on("connect_error", (err) => {
        setSocketIoStatus("error");
        pushSocketIoLog("system", `connect_error: ${err instanceof Error ? err.message : String(err)}`);
      });
      socket.onAny((event, ...args) => {
        if (["connect", "disconnect", "connect_error"].includes(event)) return;
        pushSocketIoLog("received", `${event}: ${JSON.stringify(args)}`);
      });
    } catch (e) {
      setSocketIoStatus("error");
      pushSocketIoLog("system", e instanceof Error ? e.message : "Socket.IO connect failed.");
    }
  }, [finalUrl, socketIoPath, socketIoAuthJson, socketIoPollingOnly, pushSocketIoLog]);

  const disconnectSocketIo = useCallback(() => {
    socketIoRef.current?.disconnect();
  }, []);

  const sendSocketIoMessage = useCallback(() => {
    const sock = socketIoRef.current;
    if (!sock?.connected) return;
    const ev = socketIoEvent.trim() || "message";
    const raw = socketIoOutgoing;
    let payload: unknown = raw;
    try {
      payload = JSON.parse(raw);
    } catch {
      /* send as string */
    }
    sock.emit(ev, payload);
    pushSocketIoLog("sent", `${ev}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
    setSocketIoOutgoing("");
  }, [socketIoEvent, socketIoOutgoing, pushSocketIoLog]);

  const formattedBody = useMemo(() => {
    if (!response?.body) return "";
    const ct = response.contentType;
    if (ct.includes("json")) return tryFormatJson(response.body);
    if (ct.includes("xml") || ct.includes("html")) return tryFormatXml(response.body);
    return response.body;
  }, [response]);

  const codeSnippet = useMemo(() => {
    if (transportMode === "graphql") {
      let variables: Record<string, unknown> = {};
      try {
        variables = JSON.parse(graphqlVariables.trim() || "{}") as Record<string, unknown>;
      } catch {
        variables = {};
      }
      const payloadObj: { query: string; variables: Record<string, unknown>; operationName?: string } = {
        query: graphqlQuery,
        variables,
      };
      const on = graphqlOpName.trim();
      if (on) payloadObj.operationName = on;
      const payload = JSON.stringify(payloadObj);
      const headers = buildHeaders();
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      return generateCodeSnippet(codeLang, "POST", finalUrl || "https://example.com/graphql", headers, payload);
    }
    if (transportMode === "grpc") {
      const headers = buildHeaders();
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      return generateCodeSnippet(
        codeLang,
        "POST",
        finalUrl || "https://example.com/package.Service/Method",
        headers,
        grpcJsonBody
      );
    }
    const headers = buildHeaders();
    const payload = bodyType !== "none" && !["GET", "HEAD"].includes(method) ? bodyContent : undefined;
    return generateCodeSnippet(codeLang, method, finalUrl || "https://example.com/api", headers, payload);
  }, [
    codeLang,
    method,
    finalUrl,
    bodyType,
    bodyContent,
    buildHeaders,
    transportMode,
    graphqlQuery,
    graphqlVariables,
    graphqlOpName,
    grpcJsonBody,
  ]);

  const inputClass = "px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40";

  const reqTabs: { id: RequestTab; label: string; icon: React.ElementType }[] = useMemo(() => {
    switch (transportMode) {
      case "http":
        return [
          { id: "params", label: "Params", icon: Globe },
          { id: "body", label: "Body", icon: FileText },
          { id: "auth", label: "Auth", icon: Lock },
          { id: "headers", label: "Headers", icon: Server },
        ];
      case "websocket":
        return [
          { id: "params", label: "Params", icon: Globe },
          { id: "subprotocols", label: "Subprotocols", icon: Radio },
          { id: "auth", label: "Auth", icon: Lock },
          { id: "headers", label: "Headers", icon: Server },
        ];
      case "socketio":
        return [
          { id: "params", label: "Params", icon: Globe },
          { id: "socketioOpts", label: "Connection", icon: PlugZap },
          { id: "auth", label: "Auth", icon: Lock },
          { id: "headers", label: "Headers", icon: Server },
        ];
      case "graphql":
        return [
          { id: "params", label: "Params", icon: Globe },
          { id: "graphqlOp", label: "Operation", icon: Workflow },
          { id: "graphqlVars", label: "Variables", icon: Braces },
          { id: "auth", label: "Auth", icon: Lock },
          { id: "headers", label: "Headers", icon: Server },
        ];
      case "grpc":
        return [
          { id: "params", label: "Params", icon: Globe },
          { id: "grpcJson", label: "JSON body", icon: Share2 },
          { id: "auth", label: "Auth", icon: Lock },
          { id: "headers", label: "Headers", icon: Server },
        ];
      default:
        return [];
    }
  }, [transportMode]);

  const wsLogText = useMemo(
    () =>
      wsLog
        .map((l) => `[${l.kind}] ${new Date(l.t).toISOString()}\n${l.text}`)
        .join("\n\n"),
    [wsLog]
  );

  const socketIoLogText = useMemo(
    () =>
      socketIoLog
        .map((l) => `[${l.kind}] ${new Date(l.t).toISOString()}\n${l.text}`)
        .join("\n\n"),
    [socketIoLog]
  );

  const wsStatusLabel: Record<WsConnectionStatus, string> = {
    idle: "Disconnected",
    connecting: "Connecting…",
    open: "Connected",
    closed: "Closed",
    error: "Error",
  };

  const transportTabClass = (active: boolean) =>
    `px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
      active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`;

  const resTabs: { id: ResponseTab; label: string }[] = [
    { id: "body", label: "Body" },
    { id: "headers", label: "Headers" },
    { id: "raw", label: "Raw" },
    { id: "timing", label: "Timing" },
    { id: "code", label: "Code" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full space-y-4">
        {/* Page header */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="p-2.5 rounded-xl bg-accent/10">
            <Send className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Online API Tester</h1>
            <p className="text-xs text-muted-foreground">
              HTTP, GraphQL, and gRPC (JSON) use the secure proxy. WebSocket, Socket.IO, and browser limits apply as documented below.
            </p>
          </div>
        </div>

        {/* Transport mode */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-muted/60 border border-border max-w-full animate-slide-up">
          <button
            type="button"
            className={transportTabClass(transportMode === "http")}
            onClick={() => setTransportMode("http")}
          >
            HTTP
          </button>
          <button
            type="button"
            className={transportTabClass(transportMode === "graphql")}
            onClick={() => setTransportMode("graphql")}
          >
            <span className="inline-flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5" />
              GraphQL
            </span>
          </button>
          <button
            type="button"
            className={transportTabClass(transportMode === "grpc")}
            onClick={() => setTransportMode("grpc")}
          >
            <span className="inline-flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              gRPC
            </span>
          </button>
          <button
            type="button"
            className={transportTabClass(transportMode === "websocket")}
            onClick={() => setTransportMode("websocket")}
          >
            <span className="inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              WebSocket
            </span>
          </button>
          <button
            type="button"
            className={transportTabClass(transportMode === "socketio")}
            onClick={() => setTransportMode("socketio")}
          >
            <span className="inline-flex items-center gap-1.5">
              <PlugZap className="w-3.5 h-3.5" />
              Socket.IO
            </span>
          </button>
        </div>

        {/* ── URL bar ───────────────────────────────────────────────── */}
        <div className="flex gap-2 animate-slide-up flex-wrap">
          {transportMode === "http" && (
            <>
              <div className="relative" ref={methodRef}>
                <button
                  onClick={() => setShowMethodMenu(!showMethodMenu)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-bold ${METHOD_COLORS[method]} hover:bg-muted transition-colors min-w-[100px] justify-between`}
                >
                  {method}
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>
                {showMethodMenu && (
                  <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                    {METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setMethod(m);
                          setShowMethodMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm font-bold ${METHOD_COLORS[m]} hover:bg-muted transition-colors`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendRequest()}
                placeholder="https://api.example.com/endpoint"
                className="flex-1 min-w-[200px] px-4 py-2.5 text-sm rounded-lg border border-border bg-card font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40"
              />

              <button
                onClick={sendRequest}
                disabled={loading || !url.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 ${METHOD_BG[method]} hover:opacity-90 shrink-0`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </>
          )}

          {transportMode === "graphql" && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground shrink-0">
                <Workflow className="w-4 h-4 text-accent shrink-0" />
                <span className="hidden sm:inline">GQL</span>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendGraphQLRequest()}
                placeholder="https://api.example.com/graphql"
                className="flex-1 min-w-[200px] px-4 py-2.5 text-sm rounded-lg border border-border bg-card font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={sendGraphQLRequest}
                disabled={loading || !finalUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 bg-violet-600 hover:bg-violet-700 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </>
          )}

          {transportMode === "grpc" && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground shrink-0">
                <Share2 className="w-4 h-4 text-accent shrink-0" />
                <span className="hidden sm:inline">RPC</span>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendGrpcJsonRequest()}
                placeholder="https://gateway.example.com/package.Service/Method"
                className="flex-1 min-w-[200px] px-4 py-2.5 text-sm rounded-lg border border-border bg-card font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={sendGrpcJsonRequest}
                disabled={loading || !finalUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 bg-sky-600 hover:bg-sky-700 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </>
          )}

          {transportMode === "websocket" && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground shrink-0">
                <Radio className="w-4 h-4 text-accent shrink-0" />
                <span className="hidden sm:inline">WS</span>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && wsStatus !== "open" && wsStatus !== "connecting") connectWebSocket();
                }}
                placeholder="wss://echo.websocket.events (https:// hosts map to wss://)"
                className="flex-1 min-w-[200px] px-4 py-2.5 text-sm rounded-lg border border-border bg-card font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40"
              />
              {wsStatus === "open" ? (
                <button
                  type="button"
                  onClick={disconnectWebSocket}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <Unplug className="w-4 h-4" />
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectWebSocket}
                  disabled={!wsTargetUrl || wsStatus === "connecting"}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 bg-emerald-600 hover:bg-emerald-700 shrink-0"
                >
                  {wsStatus === "connecting" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Radio className="w-4 h-4" />
                  )}
                  Connect
                </button>
              )}
            </>
          )}

          {transportMode === "socketio" && (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground shrink-0">
                <PlugZap className="w-4 h-4 text-accent shrink-0" />
                <span className="hidden sm:inline">IO</span>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && socketIoStatus !== "open" && socketIoStatus !== "connecting")
                    connectSocketIo();
                }}
                placeholder="https://your-server.com (Socket.IO server URL, same origin as HTTP)"
                className="flex-1 min-w-[200px] px-4 py-2.5 text-sm rounded-lg border border-border bg-card font-mono focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/40"
              />
              {socketIoStatus === "open" ? (
                <button
                  type="button"
                  onClick={disconnectSocketIo}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 transition-colors shrink-0"
                >
                  <Unplug className="w-4 h-4" />
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectSocketIo}
                  disabled={!finalUrl.trim() || socketIoStatus === "connecting"}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 bg-emerald-600 hover:bg-emerald-700 shrink-0"
                >
                  {socketIoStatus === "connecting" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlugZap className="w-4 h-4" />
                  )}
                  Connect
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Request configuration ─────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {transportMode === "websocket" && (
            <div className="px-4 py-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border-b border-amber-500/20 leading-relaxed">
              WebSockets run <strong>directly in your browser</strong> (not through the HTTP proxy). Custom handshake
              headers are not supported — use <strong>Params</strong> for query tokens and{" "}
              <strong>Subprotocols</strong> when needed. Sites on <strong>HTTPS</strong> require{" "}
              <code className="font-mono text-[11px]">wss://</code> (mixed content blocks{" "}
              <code className="font-mono text-[11px]">ws://</code>).
            </div>
          )}
          {transportMode === "socketio" && (
            <div className="px-4 py-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border-b border-amber-500/20 leading-relaxed">
              Socket.IO uses the <strong>socket.io-client</strong> protocol (Engine.IO + framing), not raw WebSockets.
              Connections are opened <strong>from your browser</strong> to your HTTP(S) origin — not via this site&apos;s
              HTTP proxy. Configure path and handshake auth on the <strong>Connection</strong> tab.
            </div>
          )}
          {transportMode === "graphql" && (
            <div className="px-4 py-3 text-xs text-violet-950/90 dark:text-violet-100 bg-violet-500/10 border-b border-violet-500/20 leading-relaxed">
              Sends a standard <strong>POST</strong> with <code className="font-mono text-[11px]">application/json</code>{" "}
              body <code className="font-mono text-[11px]">{"{ query, variables, operationName? }"}</code> through the{" "}
              <strong>same proxy as HTTP</strong>. For subscriptions you typically need a WebSocket transport elsewhere —
              this tab is for queries and mutations over HTTP.
            </div>
          )}
          {transportMode === "grpc" && (
            <div className="px-4 py-3 text-xs text-sky-950/90 dark:text-sky-100 bg-sky-500/10 border-b border-sky-500/20 leading-relaxed">
              Browsers cannot speak native gRPC over HTTP/2 with protobuf here. This mode sends <strong>POST</strong> with a{" "}
              <strong>JSON body</strong> to your URL — typical for <strong>gRPC-Gateway</strong>, Envoy JSON transcoding, or
              similar HTTP APIs. Wire-format gRPC-Web would need generated clients and is not included.
            </div>
          )}
          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/30">
            {reqTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReqTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  reqTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Params */}
            {reqTab === "params" && (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  {transportMode === "websocket"
                    ? "Query parameters are appended to the WebSocket URL (often used for API keys or tokens)."
                    : transportMode === "socketio"
                      ? "Query parameters are merged into the Socket.IO HTTP URL (polling / upgrade)."
                      : transportMode === "graphql" || transportMode === "grpc"
                        ? "Optional query string appended to the HTTP endpoint URL."
                        : "Query parameters will be appended to the URL."}
                </p>
                <KVTable pairs={params} onChange={setParams} />
              </div>
            )}

            {reqTab === "subprotocols" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Optional comma-separated values for the{" "}
                  <code className="font-mono text-[11px] text-foreground">Sec-WebSocket-Protocol</code> header (e.g.
                  GraphQL subscriptions).
                </p>
                <input
                  type="text"
                  value={wsSubprotocols}
                  onChange={(e) => setWsSubprotocols(e.target.value)}
                  placeholder="graphql-transport-ws, myprotocol"
                  className={`${inputClass} w-full`}
                />
              </div>
            )}

            {reqTab === "graphqlOp" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Operation name (optional)</label>
                  <input
                    type="text"
                    value={graphqlOpName}
                    onChange={(e) => setGraphqlOpName(e.target.value)}
                    placeholder="e.g. GetUser"
                    className={`${inputClass} w-full`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Query / mutation</label>
                  <textarea
                    value={graphqlQuery}
                    onChange={(e) => setGraphqlQuery(e.target.value)}
                    rows={14}
                    spellCheck={false}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 scrollbar-thin"
                  />
                </div>
              </div>
            )}

            {reqTab === "graphqlVars" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">JSON object passed as the <code className="font-mono text-[11px]">variables</code> field.</p>
                <textarea
                  value={graphqlVariables}
                  onChange={(e) => setGraphqlVariables(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  placeholder="{}"
                  className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 scrollbar-thin"
                />
              </div>
            )}

            {reqTab === "grpcJson" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unary JSON payload for your gateway path. Must be valid JSON — structure depends on your protobuf JSON mapping.
                </p>
                <textarea
                  value={grpcJsonBody}
                  onChange={(e) => setGrpcJsonBody(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  placeholder='{\n  "field": "value"\n}'
                  className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 scrollbar-thin"
                />
              </div>
            )}

            {reqTab === "socketioOpts" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Socket.IO path</label>
                  <input
                    type="text"
                    value={socketIoPath}
                    onChange={(e) => setSocketIoPath(e.target.value)}
                    placeholder="/socket.io"
                    className={`${inputClass} w-full`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Must match the server&apos;s Engine.IO path (default <code className="font-mono">/socket.io</code>).</p>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={socketIoPollingOnly}
                    onChange={(e) => setSocketIoPollingOnly(e.target.checked)}
                    className="rounded border-border accent-accent"
                  />
                  <span className="text-muted-foreground">Long-polling only (skip WebSocket upgrade)</span>
                </label>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Handshake auth (JSON object)</label>
                  <textarea
                    value={socketIoAuthJson}
                    onChange={(e) => setSocketIoAuthJson(e.target.value)}
                    rows={5}
                    spellCheck={false}
                    placeholder='{ "token": "..." }'
                    className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 scrollbar-thin"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Sent as the Socket.IO v3+ <code className="font-mono">auth</code> payload. Use <code className="font-mono">{"{}"}</code> if unused.</p>
                </div>
              </div>
            )}

            {/* Body */}
            {reqTab === "body" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["none", "json", "form", "xml", "raw"] as BodyType[]).map((bt) => (
                    <button
                      key={bt}
                      onClick={() => setBodyType(bt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        bodyType === bt
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {bt === "none" ? "None" : bt === "json" ? "JSON" : bt === "form" ? "Form" : bt === "xml" ? "XML" : "Raw"}
                    </button>
                  ))}
                </div>
                {bodyType !== "none" && (
                  <textarea
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    placeholder={bodyType === "json" ? '{\n  "key": "value"\n}' : bodyType === "xml" ? "<root>\n  <key>value</key>\n</root>" : "key=value&key2=value2"}
                    rows={8}
                    spellCheck={false}
                    className="w-full px-4 py-3 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 placeholder:text-muted-foreground/30 scrollbar-thin"
                  />
                )}
                {bodyType === "none" && (
                  <p className="text-xs text-muted-foreground">This request does not have a body.</p>
                )}
              </div>
            )}

            {/* Auth */}
            {reqTab === "auth" && (
              <div className="space-y-3">
                {transportMode === "websocket" ? (
                  <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border bg-muted/40 px-3 py-3">
                    Browser WebSocket handshakes can&apos;t carry <code className="font-mono text-[11px]">Authorization</code>{" "}
                    headers. Add tokens as <strong>Params</strong> (query string), use <strong>Subprotocols</strong> if your
                    server negotiates auth that way, or send credentials in the first message after you connect.
                  </p>
                ) : transportMode === "socketio" ? (
                  <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border bg-muted/40 px-3 py-3">
                    Configure handshake authentication as JSON on the <strong>Connection</strong> tab (
                    <code className="font-mono text-[11px]">auth</code> object). To test{" "}
                    <code className="font-mono text-[11px]">Authorization</code> headers against an HTTP API, use{" "}
                    <strong>HTTP</strong> mode instead.
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      {(["none", "bearer", "basic", "custom"] as AuthType[]).map((at) => (
                        <button
                          key={at}
                          onClick={() => setAuthType(at)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            authType === at
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {at === "none" ? "None" : at === "bearer" ? "Bearer Token" : at === "basic" ? "Basic Auth" : "Custom"}
                        </button>
                      ))}
                    </div>
                    {authType === "bearer" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Token</label>
                        <input
                          type="text"
                          value={bearerToken}
                          onChange={(e) => setBearerToken(e.target.value)}
                          placeholder="Enter bearer token"
                          className={`${inputClass} w-full`}
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">The Authorization header will be generated automatically.</p>
                      </div>
                    )}
                    {authType === "basic" && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Username</label>
                          <input type="text" value={basicUser} onChange={(e) => setBasicUser(e.target.value)} placeholder="Username" className={`${inputClass} w-full`} />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Password</label>
                          <input type="password" value={basicPass} onChange={(e) => setBasicPass(e.target.value)} placeholder="Password" className={`${inputClass} w-full`} />
                        </div>
                      </div>
                    )}
                    {authType === "custom" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Authorization Header</label>
                        <input type="text" value={customAuth} onChange={(e) => setCustomAuth(e.target.value)} placeholder="e.g. ApiKey abc123" className={`${inputClass} w-full`} />
                      </div>
                    )}
                    {authType === "none" && (
                      <p className="text-xs text-muted-foreground">No authorization header will be sent.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Headers */}
            {reqTab === "headers" && (
              <div>
                {transportMode === "websocket" ? (
                  <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border bg-muted/40 px-3 py-3">
                    The browser <code className="font-mono text-[11px]">WebSocket</code> constructor cannot send custom
                    handshake headers. Use query parameters, subprotocols, or the first frame after connection instead.
                  </p>
                ) : transportMode === "socketio" ? (
                  <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border bg-muted/40 px-3 py-3">
                    Custom HTTP headers are not supported on the Socket.IO handshake in the browser client. Use Connection tab{" "}
                    <strong>auth JSON</strong>, query <strong>Params</strong>, or emit auth payloads after connect.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-3">Custom request headers.</p>
                    <KVTable pairs={customHeaders} onChange={setCustomHeaders} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Response / WebSocket messages ───────────────────────── */}
        {(transportMode === "http" || transportMode === "graphql" || transportMode === "grpc") ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[300px]">
          {/* Status bar */}
          {response && (
            <div className={`flex flex-wrap items-center gap-4 px-4 py-2.5 border-b text-sm ${statusBg(response.status)}`}>
              <span className={`font-bold ${statusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> {response.time} ms
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" /> {formatBytes(response.size)}
              </span>
              {response.redirected && (
                <span className="flex items-center gap-1 text-xs text-warning">
                  Redirected → {response.finalUrl}
                </span>
              )}
            </div>
          )}

          {/* Response tabs */}
          <div className="flex border-b border-border bg-muted/30">
            {resTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  resTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                <p className="text-sm">Sending request...</p>
              </div>
            )}

            {resError && !loading && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Request Failed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{resError}</p>
                </div>
              </div>
            )}

            {!response && !loading && !resError && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                {resTab === "code" ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <label className="text-xs font-medium">Language:</label>
                      <select
                        value={codeLang}
                        onChange={(e) => setCodeLang(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring/40"
                      >
                        <option value="curl">cURL / Bash</option>
                        <option value="javascript">JavaScript (fetch)</option>
                        <option value="python">Python (requests)</option>
                        <option value="node">Node.js (https)</option>
                        <option value="php">PHP (cURL)</option>
                        <option value="java">Java (HttpClient)</option>
                        <option value="csharp">C# (.NET)</option>
                      </select>
                      <CopyBtn text={codeSnippet} />
                    </div>
                    <pre className="w-full p-4 rounded-lg bg-muted/50 border border-border font-mono text-xs overflow-auto max-h-[400px] scrollbar-thin whitespace-pre-wrap text-foreground text-left">
                      {codeSnippet}
                    </pre>
                  </>
                ) : (
                  <>
                    <Send className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">
                      {transportMode === "graphql"
                        ? "Enter your GraphQL HTTP endpoint and click Send."
                        : transportMode === "grpc"
                          ? "Enter your gRPC-Gateway or JSON transcoding URL and click Send."
                          : "Enter a URL and click Send to test your API."}
                    </p>
                    <p className="text-xs mt-1 opacity-60">
                      {transportMode === "graphql"
                        ? "POST with application/json body { query, variables } via proxy."
                        : transportMode === "grpc"
                          ? "POST with JSON body — not native protobuf gRPC."
                          : "Supports GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"}
                    </p>
                  </>
                )}
              </div>
            )}

            {response && !loading && (
              <>
                {/* Body tab */}
                {resTab === "body" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        Content-Type: {response.contentType || "unknown"}
                      </span>
                      <CopyBtn text={formattedBody} />
                    </div>
                    <pre className="p-4 rounded-lg bg-muted/50 border border-border font-mono text-xs overflow-auto max-h-[500px] scrollbar-thin whitespace-pre-wrap">
                      {formattedBody || "(empty body)"}
                    </pre>
                  </div>
                )}

                {/* Headers tab */}
                {resTab === "headers" && (
                  <div className="space-y-1">
                    {Object.entries(response.headers).map(([k, v]) => (
                      <div key={k} className="flex gap-3 py-1.5 border-b border-border/50 text-sm">
                        <span className="font-mono font-medium text-accent shrink-0">{k}:</span>
                        <span className="font-mono text-muted-foreground break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Raw tab */}
                {resTab === "raw" && (
                  <div>
                    <div className="flex justify-end mb-2">
                      <CopyBtn text={response.body} />
                    </div>
                    <pre className="p-4 rounded-lg bg-muted/50 border border-border font-mono text-xs overflow-auto max-h-[500px] scrollbar-thin whitespace-pre-wrap">
                      {response.body || "(empty body)"}
                    </pre>
                  </div>
                )}

                {/* Timing tab */}
                {resTab === "timing" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <TimingStat label="Total Time" value={`${response.time} ms`} accent />
                      <TimingStat label="Status" value={`${response.status}`} />
                      <TimingStat label="Size" value={formatBytes(response.size)} />
                      <TimingStat label="Redirected" value={response.redirected ? "Yes" : "No"} />
                    </div>
                    {/* Visual bar */}
                    <div className="rounded-lg bg-muted/50 border border-border p-4">
                      <p className="text-xs font-medium mb-3">Request Timeline</p>
                      <div className="h-6 rounded-full overflow-hidden bg-muted flex">
                        <div className={`${METHOD_BG[method]} h-full rounded-full transition-all`} style={{ width: "100%" }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                        <span>0 ms</span>
                        <span>{response.time} ms</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Code tab */}
                {resTab === "code" && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-xs font-medium text-muted-foreground">Language:</label>
                      <select
                        value={codeLang}
                        onChange={(e) => setCodeLang(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring/40"
                      >
                        <option value="curl">cURL / Bash</option>
                        <option value="javascript">JavaScript (fetch)</option>
                        <option value="python">Python (requests)</option>
                        <option value="node">Node.js (https)</option>
                        <option value="php">PHP (cURL)</option>
                        <option value="java">Java (HttpClient)</option>
                        <option value="csharp">C# (.NET)</option>
                      </select>
                      <CopyBtn text={codeSnippet} />
                    </div>
                    <pre className="p-4 rounded-lg bg-muted/50 border border-border font-mono text-xs overflow-auto max-h-[400px] scrollbar-thin whitespace-pre-wrap">
                      {codeSnippet}
                    </pre>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        ) : transportMode === "websocket" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[300px] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <Radio className="w-4 h-4 text-accent shrink-0" />
                <h2 className="text-sm font-semibold">Messages</h2>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    wsStatus === "open"
                      ? "bg-success/15 text-success"
                      : wsStatus === "connecting"
                        ? "bg-warning/15 text-warning"
                        : wsStatus === "error"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {wsStatusLabel[wsStatus]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CopyBtn text={wsLogText} label="Copy log" />
                <button
                  type="button"
                  onClick={() => setWsLog([])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            {wsTargetUrl ? (
              <p
                className="px-4 py-2 text-[11px] text-muted-foreground font-mono border-b border-border/50 truncate"
                title={wsTargetUrl}
              >
                {wsTargetUrl}
              </p>
            ) : null}

            <div className="flex-1 min-h-[220px] max-h-[420px] overflow-auto p-3 space-y-2 scrollbar-thin">
              {wsLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center px-4">
                  <Radio className="w-8 h-8 mb-2 opacity-25" />
                  <p className="text-sm">Connect to a server to see frames here.</p>
                  <p className="text-xs mt-2 opacity-70 max-w-md">
                    Example: <code className="font-mono text-[11px] text-foreground">wss://echo.websocket.events</code>{" "}
                    echoes anything you send.
                  </p>
                </div>
              ) : (
                wsLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg border p-2.5 font-mono text-xs ${
                      entry.kind === "sent"
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : entry.kind === "received"
                          ? "border-blue-500/25 bg-blue-500/5"
                          : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span>
                        {entry.kind === "sent"
                          ? "Sent"
                          : entry.kind === "received"
                            ? "Received"
                            : "System"}
                      </span>
                      <span>{new Date(entry.t).toLocaleTimeString()}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all text-foreground">{entry.text}</pre>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-4 space-y-2 bg-muted/20">
              <label className="text-xs font-medium text-muted-foreground">Send message</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  value={wsOutgoing}
                  onChange={(e) => setWsOutgoing(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendWebSocketMessage();
                    }
                  }}
                  placeholder="Enter to send · Shift+Enter for newline"
                  rows={3}
                  disabled={wsStatus !== "open"}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={sendWebSocketMessage}
                  disabled={wsStatus !== "open" || !wsOutgoing.trim()}
                  className="sm:self-end px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 shrink-0 inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden min-h-[300px] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <PlugZap className="w-4 h-4 text-accent shrink-0" />
                <h2 className="text-sm font-semibold">Events</h2>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    socketIoStatus === "open"
                      ? "bg-success/15 text-success"
                      : socketIoStatus === "connecting"
                        ? "bg-warning/15 text-warning"
                        : socketIoStatus === "error"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {wsStatusLabel[socketIoStatus]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CopyBtn text={socketIoLogText} label="Copy log" />
                <button
                  type="button"
                  onClick={() => setSocketIoLog([])}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            {finalUrl ? (
              <p
                className="px-4 py-2 text-[11px] text-muted-foreground font-mono border-b border-border/50 truncate"
                title={finalUrl}
              >
                {finalUrl}
              </p>
            ) : null}

            <div className="flex-1 min-h-[220px] max-h-[420px] overflow-auto p-3 space-y-2 scrollbar-thin">
              {socketIoLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center px-4">
                  <PlugZap className="w-8 h-8 mb-2 opacity-25" />
                  <p className="text-sm">Connect to a Socket.IO server to see events here.</p>
                  <p className="text-xs mt-2 opacity-70 max-w-md">
                    Use your server&apos;s HTTP(S) origin. Match <strong>Connection</strong> path to the server config.
                  </p>
                </div>
              ) : (
                socketIoLog.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg border p-2.5 font-mono text-xs ${
                      entry.kind === "sent"
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : entry.kind === "received"
                          ? "border-blue-500/25 bg-blue-500/5"
                          : "border-border bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span>
                        {entry.kind === "sent"
                          ? "Emitted"
                          : entry.kind === "received"
                            ? "Received"
                            : "System"}
                      </span>
                      <span>{new Date(entry.t).toLocaleTimeString()}</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-all text-foreground">{entry.text}</pre>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-4 space-y-3 bg-muted/20">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Event name</label>
                <input
                  type="text"
                  value={socketIoEvent}
                  onChange={(e) => setSocketIoEvent(e.target.value)}
                  placeholder="message"
                  disabled={socketIoStatus !== "open"}
                  className={`${inputClass} w-full max-w-md disabled:opacity-50`}
                />
              </div>
              <label className="text-xs font-medium text-muted-foreground">Payload</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  value={socketIoOutgoing}
                  onChange={(e) => setSocketIoOutgoing(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendSocketIoMessage();
                    }
                  }}
                  placeholder='JSON object or plain text — Enter to emit · Shift+Enter newline'
                  rows={3}
                  disabled={socketIoStatus !== "open"}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={sendSocketIoMessage}
                  disabled={socketIoStatus !== "open" || !socketIoOutgoing.trim()}
                  className="sm:self-end px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 shrink-0 inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Emit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── History ───────────────────────────────────────────────── */}
        {(transportMode === "http" || transportMode === "graphql" || transportMode === "grpc") &&
          history.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-xs font-semibold">Request History</h3>
              <button onClick={() => setHistory([])} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                Clear
              </button>
            </div>
            <div className="divide-y divide-border/50 max-h-[200px] overflow-auto scrollbar-thin">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setUrl(h.url); setMethod(h.method); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted/40 transition-colors"
                >
                  <span className={`text-xs font-bold w-14 ${METHOD_COLORS[h.method]}`}>{h.method}</span>
                  <span className="flex-1 text-xs font-mono text-muted-foreground truncate">{h.url}</span>
                  <span className={`text-xs font-medium ${statusColor(h.status)}`}>{h.status}</span>
                  <span className="text-xs text-muted-foreground">{h.time}ms</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Info section ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 pb-8">
          {[
            {
              icon: Shield,
              title: "Proxied HTTP API",
              desc: "REST, GraphQL over HTTP, and JSON-style gRPC gateways use the server proxy. WebSocket & Socket.IO connect directly from the browser.",
            },
            {
              icon: Code2,
              title: "Code generation",
              desc: "cURL, fetch, requests, and more — includes GraphQL POST bodies and gRPC JSON payloads when those modes are active.",
            },
            {
              icon: Braces,
              title: "Formatting & realtime",
              desc: "JSON/XML formatting for HTTP responses; WebSocket frames and Socket.IO events with timestamps in realtime modes.",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          Browser-based HTTP client — test APIs without installing tools
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The DevBench <strong>API Tester</strong> lets you send HTTP requests
          (GET, POST, PUT, PATCH, DELETE) directly from your browser without
          installing Postman, Insomnia, or any other client. Add headers, set a
          request body, configure authentication, and inspect formatted JSON or
          text responses — all in one workspace.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Features</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS methods</li>
          <li>Custom request headers (Authorization, Content-Type, Accept, etc.)</li>
          <li>JSON, form-data, and plain text request bodies</li>
          <li>Bearer token and Basic Auth helpers</li>
          <li>Response body displayed with syntax highlighting and copy button</li>
          <li>Response status code, headers, and timing shown</li>
          <li>Export the request as a cURL command or JavaScript fetch snippet</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          REST API vs GraphQL vs gRPC
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This tool is designed for <strong>REST APIs</strong> — the most
          common style, where resources are accessed via URL paths and HTTP
          methods. For GraphQL APIs, send a POST request with a{" "}
          <code className="font-mono text-xs">Content-Type: application/json</code>{" "}
          header and a body containing a{" "}
          <code className="font-mono text-xs">query</code> field. gRPC uses
          binary Protobuf encoding and requires a dedicated client.
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Also useful:{" "}
          <a href="/tools/curl-to-fetch" className="text-accent hover:underline">
            cURL → Fetch converter
          </a>
          {", "}
          <a href="/tools/url-parser" className="text-accent hover:underline">
            URL Parser
          </a>
          {", "}
          <a href="/json" className="text-accent hover:underline">
            JSON Formatter
          </a>
          .
        </p>
      </section>

      <Footer />
    </>
  );
}

function TimingStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
      <p className={`text-lg font-bold font-mono ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
