import { NextResponse } from "next/server";

const MAX_BYTES = 96_000;

/** Ensure a compilable unit for the upstream playground (expects `body`, not `files`). */
function wrapGoBody(src: string): string {
  const t = src.trim();
  if (!t) return "package main\n\nfunc main() {}\n";
  if (/^\s*package\s+/m.test(src)) return src;
  return `package main\n\n${src}`;
}

/**
 * Proxies to https://play.golang.org/compile (JSON `version` + `body`).
 * Unique User-Agent per https://go.dev/blog/playground "Other clients".
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const code =
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    typeof (payload as { code: unknown }).code === "string"
      ? (payload as { code: string }).code
      : "";
  if (!code.trim()) {
    return NextResponse.json({ error: "Missing `code` string" }, { status: 400 });
  }
  if (code.length > MAX_BYTES) {
    return NextResponse.json({ error: "Code exceeds size limit" }, { status: 400 });
  }

  const body = wrapGoBody(code);

  let upstream: Response;
  try {
    upstream = await fetch("https://play.golang.org/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DevBench-Playground/1.0 (https://www.devbench.co.in/playground)",
      },
      body: JSON.stringify({ version: 2, body }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upstream request failed" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: `Playground returned ${upstream.status}` }, { status: 502 });
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json({ error: "Invalid response from playground" }, { status: 502 });
  }

  const o = data as {
    Errors?: string;
    Events?: Array<{ Message?: string; Kind?: string }>;
  };

  const lines: string[] = [];
  if (o.Errors?.trim()) lines.push(o.Errors.trim());
  if (Array.isArray(o.Events)) {
    for (const ev of o.Events) {
      const msg = typeof ev.Message === "string" ? ev.Message.replace(/\r\n/g, "\n") : "";
      if (!msg) continue;
      const kind = typeof ev.Kind === "string" ? ev.Kind : "stdout";
      if (kind === "stderr") lines.push(`[stderr] ${msg}`);
      else lines.push(msg);
    }
  }

  const output = lines.join("\n").trimEnd() || "(no output)";
  return NextResponse.json({ output });
}
