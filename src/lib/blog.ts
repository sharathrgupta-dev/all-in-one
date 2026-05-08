export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  readMinutes: number;
  relatedToolSlug?: string;
  relatedToolLabel?: string;
  relatedToolHref?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-validate-json-online",
    title: "How to Validate JSON Online (Safely)",
    date: "2026-05-08",
    excerpt:
      "Validate JSON before it breaks production APIs — what “valid JSON” means, how browser-only tools differ from server uploads, and a simple workflow you can repeat every time.",
    tags: ["json", "debugging", "web"],
    readMinutes: 5,
    relatedToolSlug: "json-formatter",
    relatedToolLabel: "JSON Formatter & Validator",
    relatedToolHref: "/json",
  },
  {
    slug: "jwt-decoder-without-uploading-to-server",
    title: "JWT Decoder Without Uploading to a Server",
    date: "2026-05-07",
    excerpt:
      "Decode JWT header and payload in the browser: why Base64 is not encryption, what stays local vs what never leaves your machine, and why decoding still isn’t verification.",
    tags: ["jwt", "security", "auth"],
    readMinutes: 5,
    relatedToolSlug: "jwt-debugger",
    relatedToolLabel: "JWT Debugger",
    relatedToolHref: "/jwt-debugger",
  },
  {
    slug: "uuid-vs-ulid-vs-nanoid",
    title: "UUID vs ULID vs Nano ID: Which Should You Use?",
    date: "2026-05-05",
    excerpt:
      "UUID v4 is everywhere, but ULID and Nano ID solve real problems UUID can't. Here's a practical breakdown of when to use each.",
    tags: ["identifiers", "databases", "javascript"],
    readMinutes: 5,
    relatedToolSlug: "uuid-generator",
    relatedToolLabel: "UUID / ULID / Nano ID Generator",
    relatedToolHref: "/tools/uuid-generator",
  },
  {
    slug: "jwt-explained",
    title: "JWT Explained: Header, Payload, and Signature Decoded",
    date: "2026-05-04",
    excerpt:
      "What actually goes inside a JSON Web Token? We break down every part of a JWT, explain the signature algorithm, and show the common pitfalls.",
    tags: ["auth", "security", "jwt"],
    readMinutes: 6,
    relatedToolSlug: "jwt-debugger",
    relatedToolLabel: "JWT Debugger",
    relatedToolHref: "/jwt-debugger",
  },
  {
    slug: "encodeuricomponent-vs-encodeuri",
    title: "URL Encoding: encodeURIComponent vs encodeURI Explained",
    date: "2026-05-03",
    excerpt:
      "JavaScript has two URL encoding functions and most developers mix them up. Here's exactly when to use each one — and what breaks when you don't.",
    tags: ["javascript", "web", "urls"],
    readMinutes: 4,
    relatedToolSlug: "url-encode",
    relatedToolLabel: "URL Encoder / Decoder",
    relatedToolHref: "/tools/url-encode",
  },
  {
    slug: "common-json-errors",
    title: "What Makes JSON Invalid? The 7 Most Common JSON Syntax Errors",
    date: "2026-05-02",
    excerpt:
      "Trailing commas, single quotes, comments — these valid JavaScript patterns silently break JSON parsers. Learn to spot and fix all of them.",
    tags: ["json", "debugging", "javascript"],
    readMinutes: 4,
    relatedToolSlug: "json-formatter",
    relatedToolLabel: "JSON Formatter & Validator",
    relatedToolHref: "/json",
  },
  {
    slug: "regex-cheat-sheet-javascript",
    title: "Regular Expressions Cheat Sheet for JavaScript Developers",
    date: "2026-05-01",
    excerpt:
      "The 20 regex patterns every JavaScript developer actually uses — email, URL, IP address, date, and more — with copy-ready code.",
    tags: ["regex", "javascript", "reference"],
    readMinutes: 7,
    relatedToolSlug: "regex-tester",
    relatedToolLabel: "Regex Tester",
    relatedToolHref: "/tools/regex-tester",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
