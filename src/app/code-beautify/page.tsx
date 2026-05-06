"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Braces,
  FileCode,
  Binary,
  Type,
  Shield,
  Wrench,
  ArrowRightLeft,
  ChevronRight,
  Paintbrush,
  FileImage,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CodeBeautifyWorkspace from "@/components/CodeBeautifyWorkspace";
import { TOOLS, CATEGORIES } from "@/lib/tools-registry";

function toolHref(slug: string) {
  return slug === "json-formatter" ? "/json" : `/tools/${slug}`;
}

type HubLink = {
  href: string;
  label: string;
  hint?: string;
};

const STANDALONE_HUB: HubLink[] = [
  {
    href: "/json",
    label: "JSON Beautifier & Validator",
    hint: "Format, minify, tree, fix errors",
  },
  {
    href: "/epoch",
    label: "Unix Timestamp Converter",
    hint: "Epoch ↔ local time",
  },
  {
    href: "/jwt-debugger",
    label: "JWT Decode & Verify",
    hint: "Headers, payload, signatures",
  },
  {
    href: "/diff-checker",
    label: "Text & Code Diff",
    hint: "Side-by-side compare",
  },
  {
    href: "/cron-editor",
    label: "Cron Expression Editor",
    hint: "Human-readable schedule",
  },
  {
    href: "/api-tester",
    label: "API Tester",
    hint: "HTTP requests in browser",
  },
];

/** Inspired by [CodeBeautify](https://codebeautify.org/) popular tiles — mapped to DevBench routes. */
const POPULAR: HubLink[] = [
  { href: "/json", label: "JSON Beautifier" },
  { href: "/tools/xml-to-json", label: "XML Viewer → JSON" },
  { href: "/tools/yaml-to-json", label: "YAML → JSON" },
  { href: "/tools/json-to-yaml", label: "JSON → YAML" },
  { href: "/tools/sql-formatter", label: "SQL Formatter" },
  { href: "/tools/base64-encode", label: "Base64 Encode" },
  { href: "/tools/base64-decode", label: "Base64 Decode" },
  { href: "/tools/url-encode", label: "URL Encode" },
  { href: "/tools/url-decode", label: "URL Decode" },
  { href: "/tools/text-to-hex", label: "Text → Hex" },
  { href: "/tools/hex-to-text", label: "Hex → Text" },
  { href: "/tools/html-entity-encode", label: "HTML Encode" },
  { href: "/tools/html-entity-decode", label: "HTML Decode" },
  { href: "/jwt-debugger", label: "JWT Decode" },
  { href: "/diff-checker", label: "File / Text Diff" },
  { href: "/tools/hash-generator", label: "SHA256 / Hash Generator" },
  { href: "/tools/aes-encrypt-decrypt", label: "Encrypt / Decrypt (AES)" },
  { href: "/tools/css-minifier", label: "CSS Minify" },
  { href: "/tools/html-minifier", label: "HTML Minify" },
  { href: "/tools/markdown-to-html", label: "Markdown → HTML" },
  { href: "/tools/html-to-markdown", label: "HTML → Markdown" },
  { href: "/tools/json-to-typescript", label: "JSON → TypeScript" },
  { href: "/tools/curl-formatter", label: "cURL Formatter" },
  { href: "/tools/curl-to-fetch", label: "cURL → Fetch" },
  { href: "/tools/image-resizer", label: "Image Resizer" },
  { href: "/tools/pdf-page-editor", label: "PDF Page Editor" },
  { href: "/tools/xml-suite", label: "XML Tools Suite" },
  { href: "/tools/morse-code", label: "Morse Code Translator" },
  { href: "/tools/color-converter", label: "HEX ↔ RGB ↔ HSL" },
  { href: "/epoch", label: "Unix Timestamp" },
  { href: "/tools/uuid-generator", label: "UUID Generator" },
  { href: "/tools/base-converter", label: "Binary / Hex / Octal" },
];

const CATEGORY_SECTIONS: {
  title: string;
  icon: React.ElementType;
  links: HubLink[];
}[] = [
  {
    title: "JSON, XML & YAML",
    icon: Braces,
    links: [
      { href: "/json", label: "JSON workspace (all-in-one)" },
      { href: "/tools/json-to-yaml", label: "JSON → YAML" },
      { href: "/tools/yaml-to-json", label: "YAML → JSON" },
      { href: "/tools/json-to-xml", label: "JSON → XML" },
      { href: "/tools/xml-to-json", label: "XML → JSON" },
      { href: "/tools/xml-suite", label: "XML Tools Suite (validate, XPath, …)" },
      { href: "/tools/json-to-csv", label: "JSON → CSV" },
      { href: "/tools/csv-to-json", label: "CSV → JSON" },
      { href: "/tools/toml-to-json", label: "TOML → JSON" },
      { href: "/tools/json-diff", label: "JSON Diff" },
    ],
  },
  {
    title: "Encode & decode",
    icon: Binary,
    links: [
      { href: "/tools/base64-encode", label: "Base64 encode" },
      { href: "/tools/base64-decode", label: "Base64 decode" },
      { href: "/tools/url-encode", label: "URL encode" },
      { href: "/tools/url-decode", label: "URL decode" },
      { href: "/tools/html-entity-encode", label: "HTML entities encode" },
      { href: "/tools/html-entity-decode", label: "HTML entities decode" },
      { href: "/tools/text-to-hex", label: "Text → hex" },
      { href: "/tools/hex-to-text", label: "Hex → text" },
      { href: "/tools/text-to-binary", label: "Text → binary" },
      { href: "/tools/binary-to-text", label: "Binary → text" },
      { href: "/tools/rot13", label: "ROT13" },
    ],
  },
  {
    title: "HTML, CSS, Markdown & SQL",
    icon: FileCode,
    links: [
      { href: "/tools/html-minifier", label: "HTML minify" },
      { href: "/tools/css-minifier", label: "CSS minify" },
      { href: "/tools/markdown-to-html", label: "Markdown → HTML" },
      { href: "/tools/html-to-markdown", label: "HTML → Markdown" },
      { href: "/tools/html-to-text", label: "HTML → plain text" },
      { href: "/tools/sql-formatter", label: "SQL formatter" },
      { href: "/tools/string-escape", label: "String escape (JSON, JS, …)" },
    ],
  },
  {
    title: "Text & strings",
    icon: Type,
    links: [
      { href: "/diff-checker", label: "Diff checker" },
      { href: "/tools/case-converter", label: "Case converter" },
      { href: "/tools/word-counter", label: "Word counter" },
      { href: "/tools/regex-tester", label: "Regex tester" },
      { href: "/tools/line-sorter", label: "Sort / dedupe lines" },
      { href: "/tools/find-replace", label: "Find & replace" },
      { href: "/tools/whitespace-normalizer", label: "Whitespace cleanup" },
      { href: "/tools/lorem-ipsum", label: "Lorem ipsum" },
      { href: "/tools/text-diff", label: "Text diff (inline)" },
    ],
  },
  {
    title: "Crypto & security",
    icon: Shield,
    links: [
      { href: "/tools/hash-generator", label: "SHA / hash generator" },
      { href: "/tools/aes-encrypt-decrypt", label: "AES-256-GCM" },
      { href: "/jwt-debugger", label: "JWT debugger" },
      { href: "/tools/password-generator", label: "Password generator" },
    ],
  },
  {
    title: "Dev utilities",
    icon: Wrench,
    links: [
      { href: "/epoch", label: "Unix timestamp" },
      { href: "/cron-editor", label: "Cron editor" },
      { href: "/api-tester", label: "API tester" },
      { href: "/tools/uuid-generator", label: "UUID v4" },
      { href: "/tools/url-parser", label: "URL parser" },
      { href: "/tools/base-converter", label: "Number bases" },
      { href: "/tools/curl-formatter", label: "cURL formatter (cleanup)" },
      { href: "/tools/curl-to-fetch", label: "cURL → fetch" },
      { href: "/tools/mime-lookup", label: "MIME lookup" },
      { href: "/tools/color-converter", label: "Color converter" },
      { href: "/tools/qr-code", label: "QR code" },
    ],
  },
  {
    title: "Images & PDF",
    icon: FileImage,
    links: [
      { href: "/tools/image-resizer", label: "Image resizer (PNG, JPEG, WebP)" },
      { href: "/tools/pdf-page-editor", label: "PDF page editor (remove / extract)" },
    ],
  },
  {
    title: "Converters",
    icon: ArrowRightLeft,
    links: [
      { href: "/tools/unit-converter", label: "Length, weight, …" },
      { href: "/tools/byte-converter", label: "Bytes (KB, MB, …)" },
      { href: "/tools/temperature-converter", label: "Temperature" },
      { href: "/tools/timezone-converter", label: "Time zones" },
      { href: "/tools/duration-converter", label: "Duration" },
      { href: "/tools/number-to-words", label: "Number → words" },
      { href: "/tools/roman-numerals", label: "Roman numerals" },
    ],
  },
];

export default function CodeBeautifyPage() {
  const [search, setSearch] = useState("");

  const searchable = useMemo(() => {
    const fromTools = TOOLS.map((t) => ({
      href: toolHref(t.slug),
      label: t.name,
      haystack: `${t.name} ${t.shortName} ${t.description} ${CATEGORIES[t.category].label}`.toLowerCase(),
    }));
    const extra = [
      ...STANDALONE_HUB.map((s) => ({
        href: s.href,
        label: s.label,
        haystack: `${s.label} ${s.hint ?? ""}`.toLowerCase(),
      })),
      ...POPULAR.map((p) => ({
        href: p.href,
        label: p.label,
        haystack: p.label.toLowerCase(),
      })),
    ];
    const seen = new Set<string>();
    const merged: { href: string; label: string; haystack: string }[] = [];
    for (const row of [...extra, ...fromTools]) {
      const key = `${row.href}::${row.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
    return merged;
  }, []);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return searchable.filter((s) => s.haystack.includes(q)).slice(0, 36);
  }, [search, searchable]);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-[radial-gradient(ellipse_at_top,var(--accent-light),transparent_65%)]">
          <div className="mx-auto max-w-6xl px-4 pt-12 pb-4 text-center sm:pt-16">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <Paintbrush className="h-3.5 w-3.5 text-accent" />
              <span>Formatter &amp; converter hub</span>
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Code Beautify
            </h1>
            <p className="mx-auto mb-2 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Beautify HTML, CSS, JavaScript, Python-style indents, SQL, and more
              below — then browse validators and converters in the catalog.
            </p>
            <p className="mx-auto mb-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Everything runs in your browser on DevBench — no uploads.
            </p>
          </div>

          <CodeBeautifyWorkspace />

          <div className="mx-auto max-w-6xl px-4 pb-14 pt-4">
            <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Find more tools
            </h2>
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                autoComplete="off"
                placeholder="Search catalog (e.g. base64, yaml, hash)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-3.5 pl-12 pr-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            {search.trim() ? (
              <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 text-left">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Matches ({searchResults.length})
                </h2>
                {searchResults.length === 0 ? (
                  <p className="text-muted-foreground">
                    No matches. Try &quot;json&quot;, &quot;hex&quot;, or
                    &quot;markdown&quot;.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {searchResults.map((s) => (
                      <li key={`${s.href}-${s.label}`}>
                        <Link
                          href={s.href}
                          className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 text-sm hover:border-border hover:bg-muted/80"
                        >
                          <span className="font-medium">{s.label}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {/* Featured workspaces — quick row */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Featured workspaces
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STANDALONE_HUB.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/40 hover:shadow-md"
              >
                <p className="font-semibold group-hover:text-accent">{item.label}</p>
                {item.hint ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
                ) : null}
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Open <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular — dense grid like codebeautify.org */}
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Popular tools
          </h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <Link
                key={`${p.href}-${p.label}`}
                href={p.href}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-accent/10 hover:text-accent"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Browse by category
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {CATEGORY_SECTIONS.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <section.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {section.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Catalog layout inspired by{" "}
              <a
                href="https://codebeautify.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                CodeBeautify
              </a>
              . Want filters on every tool?{" "}
              <Link href="/" className="font-semibold text-accent hover:underline">
                DevBench home
              </Link>{" "}
              lists all {TOOLS.length}+ tools with category chips.
            </p>
          </div>
        </section>
      </main>

      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          Online code formatter — Prettier in the browser
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The DevBench <strong>Code Beautify</strong> workspace runs{" "}
          <strong>Prettier</strong> entirely in your browser to format HTML, CSS,
          JavaScript, TypeScript, TSX, JSON, Markdown, YAML, and GraphQL. For
          SQL it uses the <strong>sql-formatter</strong> library. No code is
          sent to a server — paste your messy code, click format, and get
          clean, consistently-indented output in seconds.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Supported languages</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li><strong>HTML</strong> — attribute-per-line option, void element handling</li>
          <li><strong>CSS / SCSS</strong> — property ordering, selector normalisation</li>
          <li><strong>JavaScript / TypeScript / TSX / JSX</strong> — via Prettier&apos;s babel and typescript parsers</li>
          <li><strong>JSON</strong> — consistent indentation, trailing comma removal</li>
          <li><strong>Markdown</strong> — consistent heading levels, list formatting</li>
          <li><strong>YAML</strong> — normalised indentation and quoting</li>
          <li><strong>GraphQL</strong> — schema and operation formatting</li>
          <li><strong>SQL</strong> — keyword casing, clause alignment (PostgreSQL, MySQL, SQLite)</li>
          <li><strong>Python</strong> — indent normalisation (4-space PEP 8 style)</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          Why use a code formatter?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Consistent formatting removes style debates from code reviews, makes
          diffs cleaner (one logical change = one diff hunk), and makes AI- or
          tool-generated code immediately readable. Prettier enforces an opinionated
          style so teams don&apos;t have to maintain manual style guides.
        </p>
      </section>

      <Footer />
    </>
  );
}
