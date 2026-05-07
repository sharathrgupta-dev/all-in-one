import { NextRequest, NextResponse } from "next/server";

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB
const TIMEOUT_MS = 30_000;

function isPrivateAddress(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length === 4 && parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
    const [a, b] = parts;
    return (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 127 ||
      a === 0
    );
  }
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, method, headers, payload } = body as {
      url: string;
      method: string;
      headers: Record<string, string>;
      payload?: string;
    };

    if (!url || !method) {
      return NextResponse.json({ error: "URL and method are required." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    if (BLOCKED_HOSTS.has(parsed.hostname) || isPrivateAddress(parsed.hostname)) {
      return NextResponse.json({ error: "Requests to private/internal addresses are not allowed." }, { status: 403 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const startTime = performance.now();

    const fetchOpts: RequestInit = {
      method: method.toUpperCase(),
      headers: headers || {},
      signal: controller.signal,
      redirect: "follow",
    };

    if (payload && !["GET", "HEAD"].includes(method.toUpperCase())) {
      fetchOpts.body = payload;
    }

    const response = await fetch(url, fetchOpts);
    const elapsed = Math.round(performance.now() - startTime);
    clearTimeout(timer);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    const contentType = response.headers.get("content-type") || "";
    let responseBody: string;
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_BODY_SIZE) {
      responseBody = `[Response too large: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB — truncated]`;
    } else {
      responseBody = new TextDecoder().decode(buffer);
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      contentType,
      time: elapsed,
      size: buffer.byteLength,
      redirected: response.redirected,
      finalUrl: response.url,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("abort")) {
      return NextResponse.json({ error: "Request timed out (30s limit)." }, { status: 504 });
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
