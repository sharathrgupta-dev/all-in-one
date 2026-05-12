"use client";

import { useMemo, useState, useCallback } from "react";
import { Copy, Check, ChevronDown, ChevronRight, Code2 } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";

// ── Types ─────────────────────────────────────────────────────────────────────

const ALL_FLAGS = ["g", "i", "m", "s", "u", "d"] as const;
type Flag = (typeof ALL_FLAGS)[number];

const FLAG_LABELS: Record<Flag, { title: string; desc: string }> = {
  g: { title: "global",        desc: "Find all matches (not just the first)" },
  i: { title: "insensitive",   desc: "Case-insensitive matching" },
  m: { title: "multiline",     desc: "^ and $ match start/end of each line" },
  s: { title: "dotAll",        desc: ". matches newlines too" },
  u: { title: "unicode",       desc: "Unicode support for \\u{…} escapes" },
  d: { title: "indices",       desc: "Return start/end indices for groups" },
};

interface Match {
  full: string;
  index: number;
  end: number;
  length: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string | undefined> | null;
}

const MATCH_COLORS = [
  "bg-yellow-300/70 dark:bg-yellow-600/50",
  "bg-green-300/70 dark:bg-green-600/50",
  "bg-blue-300/70 dark:bg-blue-600/50",
  "bg-pink-300/70 dark:bg-pink-600/50",
  "bg-purple-300/70 dark:bg-purple-600/50",
  "bg-orange-300/70 dark:bg-orange-600/50",
];

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Quick Reference data ──────────────────────────────────────────────────────

const REFERENCE = [
  {
    title: "Anchors",
    items: [
      { token: "^",         desc: "Start of string / line (with m flag)" },
      { token: "$",         desc: "End of string / line (with m flag)" },
      { token: "\\b",       desc: "Word boundary" },
      { token: "\\B",       desc: "Non-word boundary" },
      { token: "\\A",       desc: "Start of string (PCRE)" },
      { token: "\\Z",       desc: "End of string (PCRE)" },
    ],
  },
  {
    title: "Character classes",
    items: [
      { token: ".",         desc: "Any character except newline (or any with s)" },
      { token: "\\d",       desc: "Digit [0-9]" },
      { token: "\\D",       desc: "Non-digit" },
      { token: "\\w",       desc: "Word char [a-zA-Z0-9_]" },
      { token: "\\W",       desc: "Non-word char" },
      { token: "\\s",       desc: "Whitespace (space, tab, newline…)" },
      { token: "\\S",       desc: "Non-whitespace" },
      { token: "[abc]",     desc: "Character set — a, b, or c" },
      { token: "[^abc]",    desc: "Negated set — anything except a, b, c" },
      { token: "[a-z]",     desc: "Range — a through z" },
    ],
  },
  {
    title: "Quantifiers",
    items: [
      { token: "*",         desc: "0 or more (greedy)" },
      { token: "+",         desc: "1 or more (greedy)" },
      { token: "?",         desc: "0 or 1 (greedy)" },
      { token: "*?",        desc: "0 or more (lazy)" },
      { token: "+?",        desc: "1 or more (lazy)" },
      { token: "??",        desc: "0 or 1 (lazy)" },
      { token: "{n}",       desc: "Exactly n times" },
      { token: "{n,}",      desc: "n or more times" },
      { token: "{n,m}",     desc: "Between n and m times" },
    ],
  },
  {
    title: "Groups",
    items: [
      { token: "(abc)",          desc: "Capturing group" },
      { token: "(?<name>abc)",   desc: "Named capturing group" },
      { token: "(?:abc)",        desc: "Non-capturing group" },
      { token: "(?=abc)",        desc: "Positive lookahead" },
      { token: "(?!abc)",        desc: "Negative lookahead" },
      { token: "(?<=abc)",       desc: "Positive lookbehind" },
      { token: "(?<!abc)",       desc: "Negative lookbehind" },
      { token: "\\1",            desc: "Backreference to group 1" },
      { token: "\\k<name>",      desc: "Named backreference" },
    ],
  },
  {
    title: "Substitution tokens",
    items: [
      { token: "$&",        desc: "Whole matched string" },
      { token: "$1 $2 …",  desc: "Capture group 1, 2, …" },
      { token: "$<name>",   desc: "Named capture group" },
      { token: "$`",        desc: "Text before match" },
      { token: "$'",        desc: "Text after match" },
      { token: "$$",        desc: "Literal $" },
    ],
  },
] as const;

// ── Regex explanation (token parser) ─────────────────────────────────────────

interface RegexToken {
  raw: string;
  label: string;
  color: string;
}

function explainRegex(pattern: string): RegexToken[] {
  const tokens: RegexToken[] = [];
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];

    // Escaped char
    if (ch === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      const escaped: Record<string, string> = {
        d: "Digit", D: "Non-digit", w: "Word char", W: "Non-word char",
        s: "Whitespace", S: "Non-whitespace", b: "Word boundary", B: "Non-word boundary",
        n: "Newline", t: "Tab", r: "Carriage return", f: "Form feed",
      };
      if (escaped[next]) {
        tokens.push({ raw: `\\${next}`, label: escaped[next], color: "text-blue-500" });
      } else {
        tokens.push({ raw: `\\${next}`, label: `Literal "${next}"`, color: "text-foreground" });
      }
      i += 2;
      continue;
    }

    // Named group (?<name>...)
    if (pattern.slice(i).match(/^\(\?<[a-zA-Z_]\w*>/)) {
      const m = pattern.slice(i).match(/^\(\?<([a-zA-Z_]\w*)>/);
      if (m) {
        tokens.push({ raw: `(?<${m[1]}>`, label: `Named group "${m[1]}"`, color: "text-violet-500" });
        i += m[0].length;
        continue;
      }
    }

    // Non-capturing group / lookahead / lookbehind
    if (pattern.slice(i, i + 3) === "(?:") {
      tokens.push({ raw: "(?:", label: "Non-capturing group", color: "text-violet-400" });
      i += 3; continue;
    }
    if (pattern.slice(i, i + 3) === "(?=") {
      tokens.push({ raw: "(?=", label: "Positive lookahead", color: "text-orange-500" });
      i += 3; continue;
    }
    if (pattern.slice(i, i + 3) === "(?!") {
      tokens.push({ raw: "(?!", label: "Negative lookahead", color: "text-red-500" });
      i += 3; continue;
    }
    if (pattern.slice(i, i + 4) === "(?<=") {
      tokens.push({ raw: "(?<=", label: "Positive lookbehind", color: "text-orange-500" });
      i += 4; continue;
    }
    if (pattern.slice(i, i + 4) === "(?<!") {
      tokens.push({ raw: "(?<!", label: "Negative lookbehind", color: "text-red-500" });
      i += 4; continue;
    }

    // Character class
    if (ch === "[") {
      let j = i + 1;
      if (j < pattern.length && pattern[j] === "^") j++;
      while (j < pattern.length && pattern[j] !== "]") {
        if (pattern[j] === "\\") j++;
        j++;
      }
      const cls = pattern.slice(i, j + 1);
      const negated = cls[1] === "^";
      tokens.push({ raw: cls, label: `${negated ? "Negated c" : "C"}haracter class`, color: "text-emerald-500" });
      i = j + 1;
      continue;
    }

    // Groups
    if (ch === "(") { tokens.push({ raw: "(", label: "Capturing group start", color: "text-violet-500" }); i++; continue; }
    if (ch === ")") { tokens.push({ raw: ")", label: "Group end", color: "text-violet-500" }); i++; continue; }

    // Anchors
    if (ch === "^") { tokens.push({ raw: "^", label: "Start of string/line", color: "text-pink-500" }); i++; continue; }
    if (ch === "$") { tokens.push({ raw: "$", label: "End of string/line", color: "text-pink-500" }); i++; continue; }

    // Quantifiers
    if ("*+?".includes(ch)) {
      const lazy = pattern[i + 1] === "?";
      const labels: Record<string, string> = { "*": "0 or more", "+": "1 or more", "?": "Optional" };
      tokens.push({ raw: lazy ? ch + "?" : ch, label: `${labels[ch]}${lazy ? " (lazy)" : " (greedy)"}`, color: "text-amber-500" });
      i += lazy ? 2 : 1; continue;
    }
    if (ch === "{") {
      const m = pattern.slice(i).match(/^\{(\d+)(?:,(\d*))?\}/);
      if (m) {
        const label = m[2] === undefined ? `Exactly ${m[1]}` : m[2] === "" ? `${m[1]}+` : `${m[1]}–${m[2]}`;
        tokens.push({ raw: m[0], label, color: "text-amber-500" });
        i += m[0].length; continue;
      }
    }

    // Dot
    if (ch === ".") { tokens.push({ raw: ".", label: "Any character", color: "text-blue-400" }); i++; continue; }

    // Alternation
    if (ch === "|") { tokens.push({ raw: "|", label: "Or (alternation)", color: "text-foreground font-bold" }); i++; continue; }

    // Literal
    tokens.push({ raw: ch, label: `Literal "${ch}"`, color: "text-foreground" });
    i++;
  }
  return tokens;
}

// ── Code generator ────────────────────────────────────────────────────────────

function generateCode(pattern: string, flagStr: string, replacement: string, lang: string): string {
  const escaped = pattern.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedPy = pattern.replace(/\\/g, "\\\\");
  switch (lang) {
    case "js": return `const regex = /${pattern}/${flagStr};
const str = "your string here";

// Test
console.log(regex.test(str));

// Find all matches
const matches = [...str.matchAll(/${pattern}/${flagStr.includes("g") ? flagStr : flagStr + "g"}/)];
console.log(matches);

// Replace
const result = str.replace(/${pattern}/${flagStr}, "${replacement}");
console.log(result);`;

    case "python": return `import re

pattern = r"${escapedPy}"
flags = ${[...flagStr].map(f => ({ i: "re.IGNORECASE", m: "re.MULTILINE", s: "re.DOTALL" }[f])).filter(Boolean).join(" | ") || "0"}
string = "your string here"

# Find first match
match = re.search(pattern, string, flags)

# Find all matches
matches = re.findall(pattern, string, flags)
print(matches)

# Replace
result = re.sub(pattern, "${replacement}", string, flags=flags)
print(result)`;

    case "php": return `<?php
$pattern = "/${escaped}/${flagStr.replace(/[gud]/g, "").replace("s", "s")}";
$string  = "your string here";

// Test
preg_match($pattern, $string, $match);
var_dump($match);

// Find all
preg_match_all($pattern, $string, $matches);
var_dump($matches[0]);

// Replace
$result = preg_replace($pattern, "${replacement}", $string);
echo $result;`;

    default: return "";
  }
}

// ── Pattern library ──────────────────────────────────────────────────────────

interface LibPattern {
  name: string;
  pattern: string;
  flags: string;
  description: string;
  testString: string;
}

const PATTERN_LIBRARY: { category: string; patterns: LibPattern[] }[] = [
  {
    category: "Validation",
    patterns: [
      {
        name: "Email address",
        pattern: "\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}\\b",
        flags: "gi",
        description: "Standard email format",
        testString: "Valid: alice@example.com, bob.smith+tag@company.co.uk\nInvalid: notanemail, @nodomain.com",
      },
      {
        name: "URL (http/https)",
        pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z]{2,6}\\b(?:[-a-zA-Z0-9@:%_\\+.~#?&\\/=]*)",
        flags: "gi",
        description: "HTTP and HTTPS URLs",
        testString: "Visit https://devbench.co.in or http://example.com/path?q=1&r=2\nNot a URL: just some text",
      },
      {
        name: "IPv4 address",
        pattern: "\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
        flags: "g",
        description: "Valid IPv4 addresses (0.0.0.0 – 255.255.255.255)",
        testString: "Server: 192.168.1.1, Gateway: 10.0.0.1\nInvalid: 999.0.0.1, 256.1.2.3",
      },
      {
        name: "Phone number (US)",
        pattern: "(?:\\+1[\\s\\-.]?)?\\(?[2-9]\\d{2}\\)?[\\s\\-.]?[2-9]\\d{2}[\\s\\-.]?\\d{4}",
        flags: "g",
        description: "US phone numbers in common formats",
        testString: "Call us: (800) 555-1234 or 1-800-555-9876\nAlso: +1 212.555.0100, 8005550199",
      },
      {
        name: "Date (YYYY-MM-DD)",
        pattern: "\\b(\\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b",
        flags: "g",
        description: "ISO 8601 date format",
        testString: "Release date: 2024-01-15\nBirthday: 1990-12-31\nInvalid: 2024-13-01, 2024-00-15",
      },
      {
        name: "Credit card number",
        pattern: "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\\b",
        flags: "g",
        description: "Visa, Mastercard, Amex, Discover",
        testString: "Visa: 4111111111111111\nMastercard: 5500005555555559\nAmex: 378282246310005",
      },
      {
        name: "HEX color",
        pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",
        flags: "g",
        description: "3 or 6 digit hex color codes",
        testString: "Colors: #fff, #FF0000, #3a86ff, #abc\nInvalid: #GGGGGG, #12345",
      },
      {
        name: "UUID / GUID",
        pattern: "\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b",
        flags: "gi",
        description: "UUID v1–v5 format",
        testString: "Token: 550e8400-e29b-41d4-a716-446655440000\nAnother: 6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      },
      {
        name: "ZIP code (US)",
        pattern: "\\b\\d{5}(?:-\\d{4})?\\b",
        flags: "g",
        description: "5-digit or ZIP+4 format",
        testString: "New York: 10001\nChicago: 60601-3232\nNot ZIP: 1234, 123456",
      },
      {
        name: "Strong password",
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        flags: "m",
        description: "Min 8 chars, upper + lower + digit + special",
        testString: "Abc@1234\nweak\nNoSpecial1\nGood$Pass9",
      },
    ],
  },
  {
    category: "Extraction",
    patterns: [
      {
        name: "Hashtags",
        pattern: "#[\\w\\u0590-\\u05ff]+",
        flags: "g",
        description: "Twitter / Instagram style hashtags",
        testString: "Loving #coding and #OpenSource! Check out #DevBench for tools.",
      },
      {
        name: "@mentions",
        pattern: "@[\\w]+",
        flags: "g",
        description: "Social media @username mentions",
        testString: "Thanks @alice and @bob_smith! cc @dev_team for the fix.",
      },
      {
        name: "Numbers (integer & decimal)",
        pattern: "-?\\b\\d+(?:\\.\\d+)?\\b",
        flags: "g",
        description: "Integers and decimal numbers, including negatives",
        testString: "Price: $12.99, discount -3.5%, qty 100, temp -40 degrees",
      },
      {
        name: "HTML tags",
        pattern: "<\\/?[a-z][a-z0-9]*(?:\\s[^>]*)?>",
        flags: "gi",
        description: "Opening and closing HTML tags",
        testString: "<div class=\"box\"><p>Hello <strong>world</strong></p></div>",
      },
      {
        name: "Words in quotes",
        pattern: "\"([^\"]+)\"",
        flags: "g",
        description: "Text inside double quotes (capture group 1 = content)",
        testString: 'He said "hello world" and she replied "goodbye".',
      },
      {
        name: "Lines with content",
        pattern: "^.+$",
        flags: "gm",
        description: "Non-empty lines (multiline)",
        testString: "Line one\n\nLine three\n\nLine five",
      },
      {
        name: "Duplicate words",
        pattern: "\\b(\\w+)\\s+\\1\\b",
        flags: "gi",
        description: "Repeated consecutive words (the the, is is…)",
        testString: "This is is a test of the the duplicate word finder.",
      },
    ],
  },
  {
    category: "Strings & Text",
    patterns: [
      {
        name: "Leading/trailing whitespace",
        pattern: "^\\s+|\\s+$",
        flags: "gm",
        description: "Whitespace at start or end of each line",
        testString: "  leading spaces\nno spaces\n   tabs\t\ntrailing   ",
      },
      {
        name: "Blank lines",
        pattern: "^\\s*$",
        flags: "gm",
        description: "Empty or whitespace-only lines",
        testString: "First line\n\n\nFourth line\n   \nSixth line",
      },
      {
        name: "Non-ASCII characters",
        pattern: "[^\\x00-\\x7F]+",
        flags: "g",
        description: "Any character outside the ASCII range",
        testString: "Hello World — normal ASCII\nCafé résumé naïve\n日本語テスト\nEmoji: 🚀",
      },
      {
        name: "Version numbers",
        pattern: "\\bv?\\d+\\.\\d+(?:\\.\\d+)?(?:-[a-zA-Z0-9.]+)?\\b",
        flags: "g",
        description: "Semver and version strings like 1.2.3 or v2.0.0-beta.1",
        testString: "Using Node v20.11.0, npm 10.2.3\nReact 18.2.0, Next.js v14.0.0-rc.1",
      },
      {
        name: "Camel/PascalCase word",
        pattern: "[A-Z]?[a-z]+(?:[A-Z][a-z]+)*",
        flags: "g",
        description: "Camel or Pascal cased identifiers",
        testString: "camelCaseWord PascalCaseClass myVariableName getUserById",
      },
      {
        name: "Base64 string",
        pattern: "(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\\/]{3}=)?",
        flags: "g",
        description: "Base64 encoded strings",
        testString: "Token: SGVsbG8gV29ybGQ=\nData: dGVzdA==",
      },
    ],
  },
  {
    category: "Web & Dev",
    patterns: [
      {
        name: "CSS class names",
        pattern: "\\.([a-zA-Z_-][\\w-]*)",
        flags: "g",
        description: "CSS class selectors",
        testString: ".container .header .nav-link:hover .btn-primary { color: red; }",
      },
      {
        name: "CSS hex / rgb colors",
        pattern: "#[0-9a-fA-F]{3,8}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)",
        flags: "gi",
        description: "HEX and rgb() color values",
        testString: "color: #ff0000; background: rgb(0, 128, 255); border: #abc solid 1px;",
      },
      {
        name: "JSON key-value pairs",
        pattern: "\"(\\w+)\"\\s*:\\s*\"([^\"]+)\"",
        flags: "g",
        description: "String key-value pairs in JSON",
        testString: '{"name": "Alice", "role": "admin", "city": "Mumbai"}',
      },
      {
        name: "Console.log statements",
        pattern: "console\\.(?:log|warn|error|info|debug)\\([^)]*\\);?",
        flags: "g",
        description: "Find all console.* calls (useful for cleanup)",
        testString: 'console.log("debug value:", x);\nconst y = 2;\nconsole.warn("deprecated");\nconsole.error("oops");',
      },
      {
        name: "Import statements (JS/TS)",
        pattern: "^import\\s+(?:(?:[\\w,{}\\s*]+)\\s+from\\s+)?['\"][^'\"]+['\"];?",
        flags: "gm",
        description: "ES module import lines",
        testString: 'import React from "react";\nimport { useState, useEffect } from "react";\nimport * as utils from "./utils";\nimport type { Tool } from "@/lib/types";',
      },
      {
        name: "TODO / FIXME comments",
        pattern: "\\/\\/\\s*(?:TODO|FIXME|HACK|XXX|BUG)[:\\s].*$",
        flags: "gim",
        description: "Developer annotations in code comments",
        testString: "const x = 1; // TODO: refactor this\n// FIXME: breaks on edge case\nconst y = 2;\n// HACK: temporary workaround for #1234",
      },
      {
        name: "Markdown headings",
        pattern: "^#{1,6}\\s+.+$",
        flags: "gm",
        description: "H1–H6 Markdown headings",
        testString: "# Title\n## Section\nRegular paragraph\n### Subsection\nMore text\n#### Level 4",
      },
    ],
  },
];

// ── Default test string ───────────────────────────────────────────────────────

const DEFAULT_TEST = `The quick brown fox jumps over the lazy dog.
Pack my box with five dozen liquor jugs.
Contact: alice@example.com or bob.smith@company.org
Dates: 2024-01-15, 2023-12-31
URLs: https://devbench.co.in and http://example.com/path?q=1
IP: 192.168.1.100`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegexTesterTool({ tool }: { tool: Tool }) {
  const [pattern, setPattern] = useState("\\b[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}\\b");
  const [flags, setFlags] = useState<Set<Flag>>(new Set(["g", "i"]));
  const [testStr, setTestStr] = useState(DEFAULT_TEST);
  const [replacement, setReplacement] = useState("[EMAIL]");
  const [codeLang, setCodeLang] = useState<"js" | "python" | "php">("js");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSubst, setCopiedSubst] = useState(false);
  const [showRef, setShowRef] = useState(true);
  const [showLib, setShowLib] = useState(true);
  const [activeSection, setActiveSection] = useState<"matches" | "substitution" | "code">("matches");
  const [openRefGroup, setOpenRefGroup] = useState<number | null>(0);
  const [openLibGroup, setOpenLibGroup] = useState<number | null>(0);

  const loadPattern = useCallback((p: LibPattern) => {
    setPattern(p.pattern);
    setFlags(new Set(p.flags.split("") as Flag[]));
    setTestStr(p.testString);
    setActiveSection("matches");
  }, []);

  const toggleFlag = (f: Flag) =>
    setFlags((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });

  const flagStr = Array.from(flags).join("");

  const result = useMemo(() => {
    if (!pattern) {
      return { error: null, matches: [] as Match[], highlighted: escHtml(testStr), substituted: testStr, count: 0 };
    }
    try {
      const execFlags = flagStr.includes("g") ? flagStr : flagStr + "g";
      const re = new RegExp(pattern, execFlags);

      const matches: Match[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(testStr)) !== null) {
        matches.push({
          full: m[0],
          index: m.index,
          end: m.index + m[0].length,
          length: m[0].length,
          groups: Array.from(m).slice(1),
          namedGroups: (m.groups as Record<string, string | undefined>) ?? null,
        });
        if (m[0].length === 0) re.lastIndex++;
      }

      // Highlighted HTML
      let highlighted = "";
      let last = 0;
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        highlighted += escHtml(testStr.slice(last, match.index));
        const color = MATCH_COLORS[i % MATCH_COLORS.length];
        highlighted += `<mark class="${color} rounded px-0.5 cursor-default font-medium" title="Match ${i + 1} · index ${match.index}–${match.end}">${escHtml(match.full)}</mark>`;
        last = match.end;
      }
      highlighted += escHtml(testStr.slice(last));

      const subRe = new RegExp(pattern, execFlags);
      const substituted = testStr.replace(subRe, replacement);

      return { error: null, matches, highlighted, substituted, count: matches.length };
    } catch (e) {
      return { error: (e as Error).message, matches: [], highlighted: escHtml(testStr), substituted: testStr, count: 0 };
    }
  }, [pattern, flagStr, testStr, replacement]);

  const explanation = useMemo(() => {
    if (!pattern || result.error) return [];
    try { return explainRegex(pattern); } catch { return []; }
  }, [pattern, result.error]);

  const code = useMemo(
    () => generateCode(pattern, flagStr, replacement, codeLang),
    [pattern, flagStr, replacement, codeLang],
  );

  const copy = useCallback((text: string, which: "code" | "subst") => {
    navigator.clipboard.writeText(text).then(() => {
      if (which === "code") { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
      else { setCopiedSubst(true); setTimeout(() => setCopiedSubst(false), 2000); }
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">

        {/* ── Pattern bar ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-stretch font-mono text-sm">
            <span className="flex items-center px-3 text-muted-foreground border-r border-border bg-muted/50 select-none text-lg">
              /
            </span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="enter regex pattern…"
              className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-base"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="flex items-center px-3 text-muted-foreground border-l border-border bg-muted/50 select-none text-lg">
              /
            </span>
            {/* Flags */}
            <div className="flex items-center gap-1 px-3 border-l border-border bg-muted/30">
              {ALL_FLAGS.map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => toggleFlag(f)}
                  title={`${FLAG_LABELS[f].title} — ${FLAG_LABELS[f].desc}`}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                    flags.has(f) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Regex explanation */}
          {explanation.length > 0 && !result.error && (
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex flex-wrap gap-x-1 gap-y-1.5 font-mono text-sm">
              {explanation.map((tok, i) => (
                <span
                  key={i}
                  className={`${tok.color} cursor-default`}
                  title={tok.label}
                >
                  <span className="border-b border-dotted border-current/40">{tok.raw}</span>
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-2 self-center">
                (hover tokens for description)
              </span>
            </div>
          )}

          {result.error && (
            <div className="px-4 py-2 text-xs text-destructive border-t border-border bg-destructive/5 font-mono">
              ⚠ {result.error}
            </div>
          )}
        </div>

        {/* ── Main two-column layout ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">

          {/* Left column */}
          <div className="space-y-4">
            {/* Test string */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Test String</span>
                <span className="text-xs font-mono">
                  {result.count > 0 ? (
                    <span className="text-accent font-bold">{result.count} match{result.count !== 1 ? "es" : ""}</span>
                  ) : pattern ? (
                    <span className="text-muted-foreground">no matches</span>
                  ) : null}
                </span>
              </div>
              <textarea
                value={testStr}
                onChange={(e) => setTestStr(e.target.value)}
                rows={7}
                spellCheck={false}
                className="w-full px-4 py-3 bg-transparent text-sm font-mono focus:outline-none resize-y"
              />
            </div>

            {/* Highlighted preview */}
            {testStr && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-3 py-1.5 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Match Highlights
                </div>
                <div
                  className="p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: result.highlighted }}
                />
              </div>
            )}

            {/* Tabs: Matches / Substitution / Code */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex border-b border-border bg-muted/30">
                {(["matches", "substitution", "code"] as const).map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveSection(tab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 ${
                      activeSection === tab
                        ? "border-accent text-accent"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "code" && <Code2 className="w-3.5 h-3.5" />}
                    {tab === "matches" ? `Matches (${result.count})` : tab === "substitution" ? "Substitution" : "Code Generator"}
                  </button>
                ))}
              </div>

              {/* Matches panel */}
              {activeSection === "matches" && (
                <div>
                  {result.matches.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                      {pattern ? "No matches found." : "Enter a pattern to see matches."}
                    </p>
                  ) : (
                    <div className="divide-y divide-border max-h-80 overflow-auto">
                      {result.matches.map((m, i) => (
                        <div key={i} className="px-4 py-3 text-xs font-mono">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${MATCH_COLORS[i % MATCH_COLORS.length]}`}>
                              #{i + 1}
                            </span>
                            <span className="font-semibold text-accent">&ldquo;{m.full}&rdquo;</span>
                            <span className="text-muted-foreground">
                              {m.index}–{m.end} · length {m.length}
                            </span>
                          </div>

                          {/* Numbered groups */}
                          {m.groups.some((g) => g !== undefined) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {m.groups.map((g, gi) =>
                                g !== undefined ? (
                                  <span key={gi} className="px-2 py-0.5 rounded-md bg-muted border border-border">
                                    <span className="text-muted-foreground">Group {gi + 1}:</span>{" "}
                                    <span className="text-foreground">&ldquo;{g}&rdquo;</span>
                                  </span>
                                ) : null,
                              )}
                            </div>
                          )}

                          {/* Named groups */}
                          {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Object.entries(m.namedGroups).map(([name, val]) =>
                                val !== undefined ? (
                                  <span key={name} className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                                    <span className="text-accent">?&lt;{name}&gt;:</span>{" "}
                                    <span className="text-foreground">&ldquo;{val}&rdquo;</span>
                                  </span>
                                ) : null,
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Substitution panel */}
              {activeSection === "substitution" && (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Replace with
                      <span className="ml-2 font-normal normal-case text-muted-foreground">
                        ($& = full match · $1 $2 … = groups · $&lt;name&gt; = named group)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={replacement}
                      onChange={(e) => setReplacement(e.target.value)}
                      placeholder="replacement string"
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40">
                      <span className="text-xs font-medium text-muted-foreground">Result</span>
                      <button
                        type="button"
                        onClick={() => copy(result.substituted, "subst")}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        {copiedSubst ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedSubst ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre className="p-3 text-sm font-mono whitespace-pre-wrap">{result.substituted}</pre>
                  </div>
                </div>
              )}

              {/* Code generator panel */}
              {activeSection === "code" && (
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    {(["js", "python", "php"] as const).map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => setCodeLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          codeLang === lang ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {lang === "js" ? "JavaScript" : lang === "python" ? "Python" : "PHP"}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => copy(code, "code")}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedCode ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono overflow-x-auto whitespace-pre">
                    {code}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Pattern Library + Quick Reference */}
          <div className="space-y-2">

            {/* Pattern Library */}
            <button
              type="button"
              onClick={() => setShowLib((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              <span>Pattern Library</span>
              {showLib ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showLib && (
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                {PATTERN_LIBRARY.map((group, gi) => (
                  <div key={gi}>
                    <button
                      type="button"
                      onClick={() => setOpenLibGroup(openLibGroup === gi ? null : gi)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold hover:bg-muted/50 transition-colors text-left"
                    >
                      <span>{group.category}</span>
                      {openLibGroup === gi
                        ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {openLibGroup === gi && (
                      <div className="pb-1 divide-y divide-border/50">
                        {group.patterns.map((p, pi) => (
                          <button
                            type="button"
                            key={pi}
                            onClick={() => loadPattern(p)}
                            className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors">{p.name}</span>
                              <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono shrink-0">/{p.flags}/</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{p.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowRef((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/50 transition-colors"
            >
              <span>Quick Reference</span>
              {showRef ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showRef && (
              <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                {REFERENCE.map((section, si) => (
                  <div key={si}>
                    <button
                      type="button"
                      onClick={() => setOpenRefGroup(openRefGroup === si ? null : si)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold hover:bg-muted/50 transition-colors text-left"
                    >
                      <span>{section.title}</span>
                      {openRefGroup === si
                        ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {openRefGroup === si && (
                      <div className="px-2 pb-2 space-y-0.5">
                        {section.items.map((item, ii) => (
                          <div
                            key={ii}
                            className="flex items-baseline gap-3 px-2 py-1 rounded-md hover:bg-muted/50 cursor-default"
                            onClick={() => {
                              // clicking a reference token appends it to the pattern
                            }}
                          >
                            <code className="text-accent font-mono text-xs shrink-0 w-24 truncate">{item.token}</code>
                            <span className="text-xs text-muted-foreground leading-tight">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
