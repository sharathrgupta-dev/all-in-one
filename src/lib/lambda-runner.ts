/**
 * Runs a user-supplied Lambda handler inside a Web Worker.
 *
 * Why a Web Worker: Lambda handlers must execute with no access to the host
 * page's DOM, cookies, or storage. A Worker satisfies all three by design,
 * gives us a clean `terminate()` for hard timeouts, and keeps the main thread
 * responsive while the handler runs. The worker source is constructed at
 * runtime from a string (via Blob URL) so this stays a zero-dependency,
 * client-only tool — no build-time worker pipeline needed.
 */

export interface LambdaRunContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: number;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
  region: string;
}

export interface LambdaRunRequest {
  code: string;
  event: unknown;
  context: LambdaRunContext;
  env: Record<string, string>;
  timeoutMs: number;
  /** Handler property name — defaults to "handler". Supports "index.handler" too. */
  handlerName: string;
}

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

export interface LambdaLogEntry {
  level: LogLevel;
  message: string;
  /** ms since invocation started, like CloudWatch's request-relative timestamps. */
  at: number;
}

export interface LambdaRunSuccess {
  ok: true;
  result: unknown;
  logs: LambdaLogEntry[];
  durationMs: number;
  billedMs: number;
}

export interface LambdaRunFailure {
  ok: false;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  logs: LambdaLogEntry[];
  durationMs: number;
  billedMs: number;
  timedOut: boolean;
}

export type LambdaRunResult = LambdaRunSuccess | LambdaRunFailure;

// ─── Worker source ──────────────────────────────────────────────────────
//
// Plain string so we can wrap it in a Blob. Keep external dependencies to
// zero — no imports, no module syntax. The worker speaks postMessage only.

const WORKER_SOURCE = `
"use strict";

self.addEventListener("message", async (event) => {
  const req = event.data;
  const startedAt = performance.now();
  const logs = [];

  function record(level, args) {
    const message = args.map((a) => {
      if (typeof a === "string") return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(" ");
    logs.push({ level: level, message: message, at: performance.now() - startedAt });
  }

  const consoleProxy = {
    log:   (...a) => record("log",   a),
    info:  (...a) => record("info",  a),
    warn:  (...a) => record("warn",  a),
    error: (...a) => record("error", a),
    debug: (...a) => record("debug", a),
    trace: (...a) => record("debug", a),
  };
  self.console = consoleProxy;

  const billed = () => Math.ceil((performance.now() - startedAt));

  // Friendly stub for require() — Lambda code commonly does require("aws-sdk")
  // or require("@aws-sdk/client-s3"). We can't actually run those, but a
  // descriptive error is better than "require is not defined".
  function mockRequire(name) {
    if (name === "aws-sdk" || (typeof name === "string" && name.indexOf("@aws-sdk/") === 0)) {
      throw new Error(
        "AWS SDK calls are not available in the sandbox. Stub or mock them in your handler before testing here."
      );
    }
    throw new Error("require('" + name + "') is not supported in the sandbox.");
  }

  // Minimal process shim — env vars + the most-used fields.
  const processShim = {
    env: Object.assign(
      {
        AWS_REGION: req.context.region,
        AWS_LAMBDA_FUNCTION_NAME: req.context.functionName,
        AWS_LAMBDA_FUNCTION_VERSION: req.context.functionVersion,
        AWS_LAMBDA_FUNCTION_MEMORY_SIZE: String(req.context.memoryLimitInMB),
        AWS_LAMBDA_LOG_GROUP_NAME: req.context.logGroupName,
        AWS_LAMBDA_LOG_STREAM_NAME: req.context.logStreamName,
        AWS_EXECUTION_ENV: "AWS_Lambda_nodejs20.x",
        LAMBDA_TASK_ROOT: "/var/task",
        LAMBDA_RUNTIME_DIR: "/var/runtime",
        TZ: ":UTC",
      },
      req.env || {}
    ),
    version: "v20.11.1",
    versions: { node: "20.11.1" },
    platform: "linux",
    arch: "x64",
    argv: ["/var/lang/bin/node", "/var/runtime/index.mjs"],
    nextTick: (fn) => Promise.resolve().then(fn),
    hrtime: () => [0, 0],
  };

  // Provide a CommonJS-style "module"/"exports" sandbox so both
  // \`exports.handler = ...\` and \`module.exports = { handler }\` work.
  const exportsObj = {};
  const moduleObj = { exports: exportsObj };

  // Mock context — match AWS Lambda's NodejsContext shape.
  const remainingDeadline = startedAt + req.timeoutMs;
  const ctx = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: req.context.functionName,
    functionVersion: req.context.functionVersion,
    invokedFunctionArn: req.context.invokedFunctionArn,
    memoryLimitInMB: String(req.context.memoryLimitInMB),
    awsRequestId: req.context.awsRequestId,
    logGroupName: req.context.logGroupName,
    logStreamName: req.context.logStreamName,
    getRemainingTimeInMillis: () => Math.max(0, Math.round(remainingDeadline - performance.now())),
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  let timedOut = false;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      timedOut = true;
      reject(new Error("Task timed out after " + (req.timeoutMs / 1000) + ".00 seconds"));
    }, req.timeoutMs);
  });

  try {
    // Compile user code with a CommonJS shim. Errors here are SyntaxError.
    const compile = new Function(
      "exports", "module", "require", "process", "console", "__dirname", "__filename",
      req.code + "\\n//# sourceURL=lambda-handler.js"
    );
    compile(exportsObj, moduleObj, mockRequire, processShim, consoleProxy, "/var/task", "/var/task/index.js");

    // Resolve the handler name. Supports "handler", "index.handler", or any
    // dotted path against module.exports / exports.
    const path = String(req.handlerName || "handler").split(".");
    const root = moduleObj.exports || exportsObj;
    let handler = root;
    for (let i = 0; i < path.length; i++) {
      if (handler == null) break;
      // Skip a leading "index" segment — convention for "index.handler".
      if (i === 0 && path[i] === "index" && typeof handler[path[i]] === "undefined") continue;
      handler = handler[path[i]];
    }
    if (typeof handler !== "function") {
      throw new Error(
        "Handler '" + req.handlerName + "' was not exported. Use exports.handler = ... or module.exports.handler = ..."
      );
    }

    // Support both async handlers (Promise return) and callback style
    // (handler.length === 3). For callbacks we wrap into a Promise.
    let invocation;
    if (handler.length >= 3) {
      invocation = new Promise((resolve, reject) => {
        let settled = false;
        try {
          const maybe = handler(req.event, ctx, (err, value) => {
            if (settled) return;
            settled = true;
            if (err) reject(err instanceof Error ? err : new Error(String(err)));
            else resolve(value);
          });
          // Handler can also return a Promise even when callback is declared.
          if (maybe && typeof maybe.then === "function") {
            maybe.then((v) => { if (!settled) { settled = true; resolve(v); } },
                       (e) => { if (!settled) { settled = true; reject(e); } });
          }
        } catch (e) {
          if (!settled) { settled = true; reject(e); }
        }
      });
    } else {
      invocation = Promise.resolve().then(() => handler(req.event, ctx));
    }

    const result = await Promise.race([invocation, timeoutPromise]);

    self.postMessage({
      ok: true,
      result: result,
      logs: logs,
      durationMs: performance.now() - startedAt,
      billedMs: billed(),
    });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    self.postMessage({
      ok: false,
      error: { name: e.name, message: e.message, stack: e.stack },
      logs: logs,
      durationMs: performance.now() - startedAt,
      billedMs: billed(),
      timedOut: timedOut,
    });
  }
});
`;

let cachedWorkerUrl: string | null = null;

function getWorkerUrl(): string {
  if (cachedWorkerUrl) return cachedWorkerUrl;
  const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
  cachedWorkerUrl = URL.createObjectURL(blob);
  return cachedWorkerUrl;
}

/**
 * Run a Lambda handler in an isolated Web Worker.
 *
 * The worker is terminated as soon as the result (or timeout) arrives, so
 * runaway loops can't leak past the invocation. The Promise resolves with a
 * structured success/failure record — it never rejects on user-code errors.
 */
export function runLambda(req: LambdaRunRequest): Promise<LambdaRunResult> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const worker = new Worker(getWorkerUrl());

    // Hard cap a bit above the requested timeout — guards against the worker
    // hanging before its own setTimeout fires (e.g. blocked microtask flood).
    const hardCap = window.setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        error: {
          name: "RuntimeError",
          message: "Worker did not respond within the timeout window.",
        },
        logs: [],
        durationMs: performance.now() - startedAt,
        billedMs: Math.ceil(performance.now() - startedAt),
        timedOut: true,
      });
    }, req.timeoutMs + 1000);

    worker.onmessage = (e) => {
      window.clearTimeout(hardCap);
      worker.terminate();
      resolve(e.data as LambdaRunResult);
    };

    worker.onerror = (e) => {
      window.clearTimeout(hardCap);
      worker.terminate();
      resolve({
        ok: false,
        error: {
          name: "WorkerError",
          message: e.message || "Worker crashed before invocation completed.",
        },
        logs: [],
        durationMs: performance.now() - startedAt,
        billedMs: Math.ceil(performance.now() - startedAt),
        timedOut: false,
      });
    };

    worker.postMessage(req);
  });
}

/** AWS Lambda billing rounds to the nearest 1ms above the actual duration. */
export function formatBilled(billedMs: number, memoryMB: number): string {
  const gbSeconds = (memoryMB / 1024) * (billedMs / 1000);
  return `${billedMs} ms · ${gbSeconds.toFixed(4)} GB·s`;
}

export function makeRequestId(): string {
  // RFC 4122 v4-style. crypto.randomUUID exists in all modern browsers.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
