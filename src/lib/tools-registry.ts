export interface Tool {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ToolCategory;
  icon: string;
  inputLabel?: string;
  outputLabel?: string;
}

export type ToolCategory =
  | "encoding"
  | "json"
  | "text"
  | "dev"
  | "image"
  | "conversion";

export const CATEGORIES: Record<
  ToolCategory,
  { label: string; color: string }
> = {
  json: { label: "JSON", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  encoding: { label: "Encoding", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  text: { label: "Text", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  dev: { label: "Dev", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  image: { label: "Image", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  conversion: { label: "Conversion", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

export const TOOLS: Tool[] = [
  // JSON Tools
  { slug: "json-formatter", name: "JSON Formatter & Validator", shortName: "Format JSON", description: "Format, validate, and minify JSON with error highlighting and tree view", category: "json", icon: "{ }", inputLabel: "Paste JSON", outputLabel: "Formatted" },
  { slug: "json-diff", name: "JSON Diff", shortName: "JSON Diff", description: "Compare two JSON objects with color-coded diff visualization", category: "json", icon: "⇄", inputLabel: "JSON A", outputLabel: "JSON B" },
  { slug: "json-to-yaml", name: "JSON → YAML", shortName: "JSON → YAML", description: "Convert JSON to YAML format instantly", category: "json", icon: "→Y" },
  { slug: "yaml-to-json", name: "YAML → JSON", shortName: "YAML → JSON", description: "Convert YAML to JSON format instantly", category: "json", icon: "Y→" },
  { slug: "json-to-csv", name: "JSON → CSV", shortName: "JSON → CSV", description: "Convert JSON arrays to CSV with automatic header extraction", category: "json", icon: "→C" },
  { slug: "csv-to-json", name: "CSV → JSON", shortName: "CSV → JSON", description: "Convert CSV to JSON with type inference", category: "json", icon: "C→" },
  { slug: "json-to-typescript", name: "JSON → TypeScript", shortName: "JSON → TS", description: "Generate TypeScript interfaces from JSON data", category: "json", icon: "→T" },
  { slug: "json-to-xml", name: "JSON → XML", shortName: "JSON → XML", description: "Convert JSON to XML format", category: "json", icon: "→X" },
  { slug: "xml-to-json", name: "XML → JSON", shortName: "XML → JSON", description: "Convert XML to JSON format", category: "json", icon: "X→" },

  // Encoding Tools
  { slug: "base64-encode", name: "Base64 Encode", shortName: "Text → B64", description: "Encode text to Base64 with full UTF-8 support", category: "encoding", icon: "B64" },
  { slug: "base64-decode", name: "Base64 Decode", shortName: "B64 → Text", description: "Decode Base64 strings back to plain text", category: "encoding", icon: "←B64" },
  { slug: "url-encode", name: "URL Encode", shortName: "Text → URL", description: "URL-encode text with percent-encoding", category: "encoding", icon: "%" },
  { slug: "url-decode", name: "URL Decode", shortName: "URL → Text", description: "Decode URL-encoded strings", category: "encoding", icon: "←%" },
  { slug: "html-entity-encode", name: "HTML Entity Encode", shortName: "Text → HTML", description: "Encode special characters to HTML entities", category: "encoding", icon: "&amp;" },
  { slug: "html-entity-decode", name: "HTML Entity Decode", shortName: "HTML → Text", description: "Decode HTML entities back to plain text", category: "encoding", icon: "←&" },
  { slug: "text-to-hex", name: "Text → Hex", shortName: "Text → Hex", description: "Convert text to hexadecimal bytes", category: "encoding", icon: "0x" },
  { slug: "hex-to-text", name: "Hex → Text", shortName: "Hex → Text", description: "Convert hex bytes back to text", category: "encoding", icon: "←0x" },
  { slug: "text-to-binary", name: "Text → Binary", shortName: "Text → Bin", description: "Convert text to binary representation", category: "encoding", icon: "01" },
  { slug: "binary-to-text", name: "Binary → Text", shortName: "Bin → Text", description: "Convert binary back to text", category: "encoding", icon: "←01" },
  { slug: "rot13", name: "ROT13", shortName: "ROT13", description: "Encode or decode text with ROT13 cipher", category: "encoding", icon: "R13" },
  { slug: "morse-code", name: "Morse Code", shortName: "Morse", description: "Convert text to Morse code and back", category: "encoding", icon: "·−" },

  // Text Tools
  { slug: "case-converter", name: "Case Converter", shortName: "Cases", description: "Convert text to camelCase, PascalCase, snake_case, kebab-case, and more", category: "text", icon: "Aa" },
  { slug: "text-diff", name: "Text Diff", shortName: "Text Diff", description: "Compare two texts and highlight differences", category: "text", icon: "±" },
  { slug: "word-counter", name: "Word Counter", shortName: "Words", description: "Count words, characters, sentences with reading time", category: "text", icon: "#" },
  { slug: "regex-tester", name: "Regex Tester", shortName: "Regex", description: "Test regular expressions with match highlighting", category: "text", icon: "/.*/" },
  { slug: "slug-generator", name: "Slug Generator", shortName: "Slug", description: "Generate URL-friendly slugs from text", category: "text", icon: "—" },
  { slug: "lorem-ipsum", name: "Lorem Ipsum", shortName: "Lorem", description: "Generate placeholder text in paragraphs, sentences, or words", category: "text", icon: "Lrm" },
  { slug: "line-sorter", name: "Line Sorter", shortName: "Sort", description: "Sort, reverse, deduplicate, or shuffle lines", category: "text", icon: "↕" },
  { slug: "find-replace", name: "Find & Replace", shortName: "Find", description: "Find and replace with plain text or regex", category: "text", icon: "🔍" },
  { slug: "whitespace-normalizer", name: "Whitespace Normalizer", shortName: "Trim", description: "Trim lines, collapse spaces, remove blank lines", category: "text", icon: "⎵" },
  { slug: "string-reverse", name: "String Reverse", shortName: "Reverse", description: "Reverse any string with full Unicode support", category: "text", icon: "↔" },
  { slug: "markdown-to-html", name: "Markdown → HTML", shortName: "MD → HTML", description: "Convert Markdown to HTML with GFM support", category: "text", icon: "M→" },
  { slug: "html-to-markdown", name: "HTML → Markdown", shortName: "HTML → MD", description: "Convert HTML back to Markdown", category: "text", icon: "←M" },
  { slug: "html-to-text", name: "HTML → Plain Text", shortName: "HTML → Text", description: "Strip all HTML tags and return plain text", category: "text", icon: "←H" },
  { slug: "strip-markdown", name: "Strip Markdown", shortName: "Strip MD", description: "Remove all Markdown formatting", category: "text", icon: "✕M" },

  // Dev Tools
  { slug: "aes-encrypt-decrypt", name: "AES-256-GCM Encryptor", shortName: "AES", description: "Encrypt and decrypt text with AES-256-GCM — password-based, client-side only", category: "dev", icon: "🔐" },
  { slug: "hash-generator", name: "Hash Generator", shortName: "Hash", description: "Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes", category: "dev", icon: "##" },
  { slug: "uuid-generator", name: "UUID Generator", shortName: "UUID", description: "Generate random UUID v4 values", category: "dev", icon: "ID" },
  { slug: "color-converter", name: "Color Converter", shortName: "Color", description: "Convert HEX, RGB, HSL colors with preview", category: "dev", icon: "🎨" },
  { slug: "unix-timestamp", name: "Unix Timestamp", shortName: "Time", description: "Convert Unix timestamps to dates and back", category: "dev", icon: "⏱" },
  { slug: "cron-parser", name: "Cron Parser", shortName: "Cron", description: "Parse cron expressions with plain-English description", category: "dev", icon: "⏰" },
  { slug: "password-generator", name: "Password Generator", shortName: "Pass", description: "Generate secure random passwords", category: "dev", icon: "🔑" },
  { slug: "qr-code", name: "QR Code Generator", shortName: "QR", description: "Generate QR codes from text or URLs", category: "dev", icon: "▣" },
  { slug: "url-parser", name: "URL Parser", shortName: "URL", description: "Parse URLs into components", category: "dev", icon: "🔗" },
  { slug: "base-converter", name: "Base Converter", shortName: "Base", description: "Convert between decimal, hex, binary, octal", category: "dev", icon: "N" },
  { slug: "css-minifier", name: "CSS Minifier", shortName: "CSS Min", description: "Minify and compress CSS", category: "dev", icon: "CSS" },
  { slug: "html-minifier", name: "HTML Minifier", shortName: "HTML Min", description: "Minify and compress HTML", category: "dev", icon: "HTML" },
  { slug: "sql-formatter", name: "SQL Formatter", shortName: "SQL", description: "Format and pretty-print SQL queries", category: "dev", icon: "SQL" },
  { slug: "toml-to-json", name: "TOML → JSON", shortName: "TOML → JSON", description: "Convert TOML to JSON format", category: "dev", icon: "T→J" },
  { slug: "curl-to-fetch", name: "cURL → Fetch", shortName: "cURL", description: "Convert cURL commands to JavaScript fetch()", category: "dev", icon: "→JS" },
  { slug: "string-escape", name: "String Escape", shortName: "Escape", description: "Escape strings for JSON, JS, SQL, Regex", category: "dev", icon: "\\\\" },
  { slug: "mime-lookup", name: "MIME Type Lookup", shortName: "MIME", description: "Look up MIME types by file extension", category: "dev", icon: "📋" },

  // Conversion Tools
  { slug: "temperature-converter", name: "Temperature Converter", shortName: "Temp", description: "Convert Celsius, Fahrenheit, and Kelvin", category: "conversion", icon: "°" },
  { slug: "byte-converter", name: "Byte Converter", shortName: "Bytes", description: "Convert B, KB, MB, GB, TB, PB", category: "conversion", icon: "💾" },
  { slug: "unit-converter", name: "Unit Converter", shortName: "Units", description: "Convert length, weight, area, volume, speed", category: "conversion", icon: "📐" },
  { slug: "number-to-words", name: "Number → Words", shortName: "Num→Words", description: "Convert numbers to English words", category: "conversion", icon: "123" },
  { slug: "roman-numerals", name: "Roman Numerals", shortName: "Roman", description: "Convert between Roman numerals and decimal", category: "conversion", icon: "IV" },
  { slug: "timezone-converter", name: "Timezone Converter", shortName: "TZ", description: "Convert times between world time zones", category: "conversion", icon: "🌐" },
  { slug: "duration-converter", name: "Duration Converter", shortName: "Duration", description: "Convert seconds to HH:MM:SS and breakdown", category: "conversion", icon: "⏳" },
  { slug: "percentage-calc", name: "Percentage Calculator", shortName: "%", description: "Calculate percentages — X% of Y, % change", category: "conversion", icon: "%" },
  { slug: "aspect-ratio", name: "Aspect Ratio Calculator", shortName: "Ratio", description: "Calculate aspect ratio from dimensions", category: "conversion", icon: "⊞" },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}
