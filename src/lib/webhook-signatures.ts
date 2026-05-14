/**
 * Signs (and verifies) webhook payloads exactly the way each provider does.
 *
 * Everything runs in the browser via WebCrypto's HMAC. The secret never leaves
 * the device — that's the whole point of doing it client-side. Verification
 * uses a constant-time compare so a real receiver could be confidently tested
 * against this implementation.
 */

export type WebhookProvider =
  | "github"
  | "stripe"
  | "slack"
  | "shopify"
  | "generic";

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";
export type Encoding = "hex" | "base64";

export interface SignedHeaders {
  /** Map of header name → value, ready to merge into an HTTP request. */
  headers: Record<string, string>;
  /** The bytes that were signed — useful for the Verify UI's "what was hashed" view. */
  signedPayload: string;
  /** The raw signature in its chosen encoding (hex/base64). */
  signature: string;
}

export interface SignOptions {
  provider: WebhookProvider;
  body: string;
  secret: string;
  /** Unix seconds — required for Stripe and Slack. */
  timestamp?: number;
  /** Stripe/GitHub event header value (e.g. "payment_intent.succeeded"). */
  eventType?: string;
  /** Generic provider config — ignored for named providers. */
  generic?: {
    algorithm: HashAlgorithm;
    encoding: Encoding;
    headerName: string;
    /** Optional prefix appended to the signature (e.g. "sha256="). */
    prefix?: string;
  };
}

// ─── WebCrypto helpers ─────────────────────────────────────────────────

function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Web Crypto is unavailable. Open this site over HTTPS or http://localhost — plain HTTP on a LAN hostname disables HMAC in the browser.",
    );
  }
  return subtle;
}

async function hmac(
  algorithm: HashAlgorithm,
  secret: string,
  body: string,
): Promise<ArrayBuffer> {
  const subtle = requireSubtle();
  const enc = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign", "verify"],
  );
  return subtle.sign("HMAC", key, enc.encode(body));
}

export function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function encodeSignature(buf: ArrayBuffer, encoding: Encoding): string {
  return encoding === "hex" ? bufferToHex(buf) : bufferToBase64(buf);
}

/**
 * Constant-time-ish string compare for signatures.
 *
 * `crypto.subtle.timingSafeEqual` doesn't exist in browsers (only Node), so
 * we implement equivalent semantics: walk both strings to the longest length
 * and XOR-accumulate the diff. Avoids early-exit timing leaks that a naïve
 * `a === b` can give.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still walk to avoid leaking the length difference via early return.
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      diff |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return diff === 0 && a.length === b.length;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── Per-provider signing ──────────────────────────────────────────────

export async function signWebhook(opts: SignOptions): Promise<SignedHeaders> {
  const { provider, body, secret } = opts;

  switch (provider) {
    case "github": {
      // https://docs.github.com/en/webhooks/webhook-events-and-payloads
      // X-Hub-Signature-256: sha256=<hex(HMAC-SHA256(body, secret))>
      const buf = await hmac("SHA-256", secret, body);
      const sig = bufferToHex(buf);
      return {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "GitHub-Hookshot/devbench",
          "X-GitHub-Event": opts.eventType ?? "push",
          "X-GitHub-Delivery": crypto.randomUUID(),
          "X-Hub-Signature-256": `sha256=${sig}`,
          // The legacy SHA-1 header is still sent for backward compatibility.
          "X-Hub-Signature": `sha1=${bufferToHex(await hmac("SHA-1", secret, body))}`,
        },
        signedPayload: body,
        signature: sig,
      };
    }

    case "stripe": {
      // https://stripe.com/docs/webhooks/signatures
      // Stripe-Signature: t=<unix>,v1=<hex(HMAC-SHA256(`${t}.${body}`, secret))>
      const ts = opts.timestamp ?? Math.floor(Date.now() / 1000);
      const signedPayload = `${ts}.${body}`;
      const buf = await hmac("SHA-256", secret, signedPayload);
      const sig = bufferToHex(buf);
      return {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
          "Stripe-Signature": `t=${ts},v1=${sig}`,
        },
        signedPayload,
        signature: sig,
      };
    }

    case "slack": {
      // https://api.slack.com/authentication/verifying-requests-from-slack
      // base = `v0:${ts}:${body}`; X-Slack-Signature = `v0=${hex(HMAC-SHA256(base))}`
      const ts = opts.timestamp ?? Math.floor(Date.now() / 1000);
      const signedPayload = `v0:${ts}:${body}`;
      const buf = await hmac("SHA-256", secret, signedPayload);
      const sig = bufferToHex(buf);
      return {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
          "X-Slack-Request-Timestamp": String(ts),
          "X-Slack-Signature": `v0=${sig}`,
        },
        signedPayload,
        signature: sig,
      };
    }

    case "shopify": {
      // https://shopify.dev/docs/apps/webhooks/configuration/https#verify-a-webhook
      // X-Shopify-Hmac-Sha256: base64(HMAC-SHA256(body, secret))
      const buf = await hmac("SHA-256", secret, body);
      const sig = bufferToBase64(buf);
      return {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Shopify/devbench",
          "X-Shopify-Topic": opts.eventType ?? "orders/create",
          "X-Shopify-Shop-Domain": "devbench-store.myshopify.com",
          "X-Shopify-Hmac-Sha256": sig,
          "X-Shopify-Webhook-Id": crypto.randomUUID(),
        },
        signedPayload: body,
        signature: sig,
      };
    }

    case "generic": {
      const cfg = opts.generic ?? {
        algorithm: "SHA-256" as const,
        encoding: "hex" as const,
        headerName: "X-Signature",
      };
      const buf = await hmac(cfg.algorithm, secret, body);
      const raw = encodeSignature(buf, cfg.encoding);
      const sig = cfg.prefix ? `${cfg.prefix}${raw}` : raw;
      return {
        headers: {
          "Content-Type": "application/json",
          [cfg.headerName]: sig,
        },
        signedPayload: body,
        signature: raw,
      };
    }
  }
}

// ─── Verify ─────────────────────────────────────────────────────────────

export interface VerifyOptions {
  provider: WebhookProvider;
  body: string;
  secret: string;
  /** The signature header value (e.g. "sha256=abc...", "t=...,v1=...", base64 string). */
  signature: string;
  /** Timestamp for Stripe/Slack — required if verifying those. */
  timestamp?: number;
  generic?: SignOptions["generic"];
}

export interface VerifyResult {
  valid: boolean;
  /** What we computed locally, in the same encoding as the input. */
  expected: string;
  /** What we extracted from the input signature header. */
  actual: string;
  /** Human-readable reason if invalid (parse error, drift, mismatch). */
  reason?: string;
}

/** Extract Stripe's v1 signature and timestamp from a comma-separated header. */
function parseStripeSig(header: string): { ts: number; v1: string } | null {
  const parts = header.split(",").map((p) => p.trim());
  let ts: number | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t") ts = Number(v);
    if (k === "v1") v1 = v;
  }
  if (ts === null || !v1) return null;
  return { ts, v1 };
}

export async function verifyWebhook(opts: VerifyOptions): Promise<VerifyResult> {
  const { provider, body, secret, signature } = opts;

  try {
    switch (provider) {
      case "github": {
        const stripped = signature.startsWith("sha256=")
          ? signature.slice(7)
          : signature;
        const expected = bufferToHex(await hmac("SHA-256", secret, body));
        return {
          valid: constantTimeEqual(expected, stripped),
          expected,
          actual: stripped,
        };
      }

      case "stripe": {
        const parsed = parseStripeSig(signature);
        if (!parsed) {
          return { valid: false, expected: "", actual: signature, reason: "Could not parse Stripe-Signature header" };
        }
        const expected = bufferToHex(await hmac("SHA-256", secret, `${parsed.ts}.${body}`));
        const valid = constantTimeEqual(expected, parsed.v1);
        return { valid, expected, actual: parsed.v1 };
      }

      case "slack": {
        const stripped = signature.startsWith("v0=") ? signature.slice(3) : signature;
        const ts = opts.timestamp;
        if (typeof ts !== "number") {
          return { valid: false, expected: "", actual: stripped, reason: "Slack verification requires a timestamp" };
        }
        const expected = bufferToHex(await hmac("SHA-256", secret, `v0:${ts}:${body}`));
        return { valid: constantTimeEqual(expected, stripped), expected, actual: stripped };
      }

      case "shopify": {
        const expected = bufferToBase64(await hmac("SHA-256", secret, body));
        return {
          valid: constantTimeEqual(expected, signature),
          expected,
          actual: signature,
        };
      }

      case "generic": {
        const cfg = opts.generic ?? {
          algorithm: "SHA-256" as const,
          encoding: "hex" as const,
          headerName: "X-Signature",
        };
        const buf = await hmac(cfg.algorithm, secret, body);
        const expected = encodeSignature(buf, cfg.encoding);
        let actual = signature;
        if (cfg.prefix && actual.startsWith(cfg.prefix)) actual = actual.slice(cfg.prefix.length);
        return { valid: constantTimeEqual(expected, actual), expected, actual };
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown verification error";
    return { valid: false, expected: "", actual: signature, reason: msg };
  }
}
