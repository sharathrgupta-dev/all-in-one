/**
 * First-class workspace routes (multi-tool pages). Kept in one module so the
 * command palette, shortcuts, and docs stay aligned.
 */
export type WorkspaceShortcut = {
  id: string;
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  /** Extra tokens matched by the command palette (lowercased when searching). */
  keywords: readonly string[];
};

export const DEVBENCH_WORKSPACES: readonly WorkspaceShortcut[] = [
  {
    id: "json",
    href: "/json",
    label: "JSON Toolkit",
    shortLabel: "JSON",
    description: "Format, validate, tree, diff, convert, schema, table — full JSON workspace",
    keywords: ["formatter", "validator", "minify", "yaml", "csv", "schema", "diff", "ndjson"],
  },
  {
    id: "yaml",
    href: "/yaml",
    label: "YAML Toolkit",
    shortLabel: "YAML",
    description: "Format and convert YAML with validation",
    keywords: ["yml", "kubernetes", "docker compose"],
  },
  {
    id: "pdf",
    href: "/pdf",
    label: "PDF tools hub",
    shortLabel: "PDF",
    description: "Merge, split, compress, convert, watermark — browser-only PDF utilities",
    keywords: ["merge", "split", "jpg", "compress", "watermark"],
  },
  {
    id: "diff",
    href: "/diff-checker",
    label: "Diff checker",
    shortLabel: "Diff",
    description: "Compare two texts or files side by side",
    keywords: ["compare", "text diff", "patch"],
  },
  {
    id: "api",
    href: "/api-tester",
    label: "API tester",
    shortLabel: "API",
    description: "HTTP requests with headers, auth, and response view",
    keywords: ["rest", "fetch", "graphql", "curl"],
  },
  {
    id: "jwt",
    href: "/jwt-debugger",
    label: "JWT debugger",
    shortLabel: "JWT",
    description: "Decode and inspect JSON Web Tokens",
    keywords: ["token", "bearer", "oauth"],
  },
  {
    id: "code-beautify",
    href: "/code-beautify",
    label: "Code beautify hub",
    shortLabel: "Beautify",
    description: "Prettier-style formatting and links to language tools",
    keywords: ["prettier", "format", "typescript", "javascript"],
  },
  {
    id: "cron",
    href: "/cron-editor",
    label: "Cron editor",
    shortLabel: "Cron",
    description: "Build and explain crontab expressions",
    keywords: ["scheduler", "crontab"],
  },
  {
    id: "lambda-sandbox",
    href: "/lambda-sandbox",
    label: "AWS Lambda sandbox",
    shortLabel: "Lambda",
    description: "Run Node.js handlers against API Gateway, SQS, S3, EventBridge events — sandboxed",
    keywords: ["aws", "serverless", "function", "invoke", "api gateway", "sqs", "s3", "eventbridge"],
  },
  {
    id: "webhook-simulator",
    href: "/webhook-simulator",
    label: "Webhook payload simulator",
    shortLabel: "Webhook",
    description: "Generate, send and verify signed GitHub/Stripe/Slack/Shopify webhook payloads",
    keywords: ["webhook", "hmac", "signature", "github", "stripe", "slack", "shopify", "x-hub-signature"],
  },
  {
    id: "playground",
    href: "/playground",
    label: "Code playground",
    shortLabel: "Play",
    description: "Sandboxed JS/TS, Python (Pyodide), and .ipynb code cells — also at playground.devbench.co.in",
    keywords: ["monaco", "typescript", "python", "jupyter", "pyodide", "snippet", "repl", "wasm", "playground.devbench"],
  },
] as const;

/** Map legacy tool slugs that live on a workspace URL (palette + deep links). */
export const TOOL_SLUG_TO_WORKSPACE: Readonly<Record<string, string>> = {
  "json-formatter": "/json",
  "yaml-to-json": "/yaml",
  "json-to-yaml": "/yaml",
  "yaml-formatter": "/yaml",
  "lambda-sandbox": "/lambda-sandbox",
  "webhook-simulator": "/webhook-simulator",
  "code-playground": "/playground",
};

export function workspaceHrefForToolSlug(slug: string): string | undefined {
  return TOOL_SLUG_TO_WORKSPACE[slug];
}

/** Public URL for a tool card or sitemap — workspace routes override `/tools/[slug]`. */
export function publicHrefForToolSlug(slug: string): string {
  return workspaceHrefForToolSlug(slug) ?? `/tools/${slug}`;
}

export function filterWorkspaces(query: string): WorkspaceShortcut[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...DEVBENCH_WORKSPACES];
  return DEVBENCH_WORKSPACES.filter(
    (w) =>
      w.label.toLowerCase().includes(q) ||
      w.shortLabel.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      w.keywords.some((k) => k.includes(q)),
  );
}
