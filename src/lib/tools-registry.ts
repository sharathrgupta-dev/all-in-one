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
  | "conversion"
  | "finance"
  | "health"
  | "math"
  | "datetime";

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
  finance: { label: "Finance", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  health: { label: "Health", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  math: { label: "Math", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  datetime: { label: "Date & time", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
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
  { slug: "base64-image", name: "Base64 Image", shortName: "B64 Img", description: "Encode images to Base64 data URIs or decode a Base64 string back to a viewable image", category: "encoding", icon: "🖼" },
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
  { slug: "string-inspector", name: "String Inspector", shortName: "Inspect", description: "Deep-inspect any string — length, bytes, Unicode codepoints, char frequency, entropy", category: "text", icon: "🔬" },
  { slug: "markdown-preview", name: "Markdown Preview", shortName: "MD Live", description: "Live side-by-side Markdown editor and rendered HTML preview with GFM support", category: "text", icon: "MD" },
  { slug: "regex-tester", name: "Regex Tester", shortName: "Regex", description: "Test regular expressions with live match highlighting, group capture view, and substitution", category: "text", icon: "/.*/", },
  { slug: "case-converter", name: "Case Converter", shortName: "Cases", description: "Convert text to camelCase, PascalCase, snake_case, kebab-case, and more", category: "text", icon: "Aa" },
  { slug: "text-diff", name: "Text Diff", shortName: "Text Diff", description: "Compare two texts and highlight differences", category: "text", icon: "±" },
  { slug: "word-counter", name: "Word Counter", shortName: "Words", description: "Count words, characters, sentences with reading time", category: "text", icon: "#" },
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
  { slug: "unicode-checker", name: "Unicode Checker", shortName: "Unicode", description: "Inspect every character: codepoint, name, category, script, UTF-8 bytes, HTML entity — highlights invisible and dangerous characters", category: "text", icon: "U+" },

  // Dev Tools
  { slug: "aes-encrypt-decrypt", name: "AES-256-GCM Encryptor", shortName: "AES", description: "Encrypt and decrypt text with AES-256-GCM — password-based, client-side only", category: "dev", icon: "🔐" },
  { slug: "hash-generator", name: "Hash Generator", shortName: "Hash", description: "Generate SHA-1, SHA-256, SHA-384, SHA-512 hashes", category: "dev", icon: "##" },
  { slug: "uuid-generator", name: "UUID / ULID / Nano ID", shortName: "UUID", description: "Generate UUID v4, ULID, or Nano ID values with one click", category: "dev", icon: "ID" },
  { slug: "html-to-jsx", name: "HTML → JSX", shortName: "HTML→JSX", description: "Convert HTML to React JSX — class→className, self-closing void elements, camelCase events", category: "dev", icon: "⚛" },
  { slug: "html-preview", name: "HTML Preview", shortName: "Preview", description: "Live-render HTML in a sandboxed iframe with optional JavaScript execution", category: "dev", icon: "🖥" },
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
  { slug: "curl-formatter", name: "cURL Formatter", shortName: "cURL fmt", description: "Normalize messy cURL into clean, copy-pasteable commands (quotes, flags, line breaks)", category: "dev", icon: "⌘", inputLabel: "Messy cURL", outputLabel: "Formatted cURL" },
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
  { slug: "world-clock", name: "World Clock", shortName: "Clock", description: "Current time across major cities (same grid as timezone tool)", category: "datetime", icon: "🌍", inputLabel: "Optional ISO date/time (blank = now)", outputLabel: "Times" },

  // Finance (Tool Stack–style)
  { slug: "simple-interest", name: "Simple Interest", shortName: "SI", description: "principal=… rate=… time=… (% per year, years)", category: "finance", icon: "💵", inputLabel: "Values (key=value lines)", outputLabel: "Result" },
  { slug: "gst-calculator", name: "GST / VAT Calculator", shortName: "GST", description: "amount + rate; exclusive adds tax or inclusive extracts tax", category: "finance", icon: "🧾", inputLabel: "amount=… rate=…", outputLabel: "Breakdown" },
  { slug: "discount-calculator", name: "Discount Calculator", shortName: "−%", description: "price=… discount=… (% off)", category: "finance", icon: "🏷", inputLabel: "Values", outputLabel: "Sale price" },
  { slug: "tip-calculator", name: "Tip Calculator", shortName: "Tip", description: "bill=… tip=… split=…", category: "finance", icon: "🍽", inputLabel: "Values", outputLabel: "Totals" },
  { slug: "roi-calculator", name: "ROI Calculator", shortName: "ROI", description: "cost & gain, or cost & profit", category: "finance", icon: "📈", inputLabel: "Values", outputLabel: "ROI %" },
  { slug: "profit-loss-calculator", name: "Profit & Loss", shortName: "P&L", description: "revenue=… cost=… → margin & markup", category: "finance", icon: "📊", inputLabel: "Values", outputLabel: "Analysis" },
  { slug: "compound-interest", name: "Compound Interest", shortName: "Compound", description: "Future value with compounding frequency — interactive form", category: "finance", icon: "📉" },
  { slug: "loan-emi-calculator", name: "Loan EMI Calculator", shortName: "EMI", description: "Monthly EMI, total interest, amortization-style summary", category: "finance", icon: "🏦" },

  // Health & fitness
  { slug: "bmi-calculator", name: "BMI Calculator", shortName: "BMI", description: "Body mass index from height & weight with WHO-style bands", category: "health", icon: "⚖" },
  { slug: "bmr-calculator", name: "BMR Calculator", shortName: "BMR", description: "Basal metabolic rate (Mifflin–St Jeor); key=value lines", category: "health", icon: "🔥", inputLabel: "weight, height, age, sex", outputLabel: "BMR" },
  { slug: "calorie-calculator", name: "Calorie Calculator (TDEE)", shortName: "kcal", description: "TDEE from BMR × activity level", category: "health", icon: "🥗", inputLabel: "See placeholder", outputLabel: "TDEE" },
  { slug: "water-intake-calculator", name: "Water Intake", shortName: "H₂O", description: "Rough daily fluid estimate from weight (+ exercise)", category: "health", icon: "💧", inputLabel: "weight=… exercise=…", outputLabel: "Estimate" },
  { slug: "body-fat-calculator", name: "Body Fat Estimator", shortName: "BF%", description: "Deurenberg formula from BMI, age, sex — estimate only", category: "health", icon: "❤", inputLabel: "weight, height, age, sex", outputLabel: "Estimate %" },

  // Math solvers
  { slug: "quadratic-solver", name: "Quadratic Solver", shortName: "x²", description: "Roots of ax²+bx+c=0 (real or complex)", category: "math", icon: "∆", inputLabel: "a= b= c=", outputLabel: "Roots" },
  { slug: "pythagorean-theorem", name: "Pythagorean Theorem", shortName: "△", description: "Find missing side (two of a, b, c)", category: "math", icon: "📐", inputLabel: "Two sides", outputLabel: "Third side" },
  { slug: "gcd-lcm-calculator", name: "GCD & LCM", shortName: "GCD", description: "Greatest common divisor & least common multiple", category: "math", icon: "🔢", inputLabel: "a= b= or two integers", outputLabel: "GCD / LCM" },

  // Date & time utilities
  { slug: "age-calculator", name: "Age Calculator", shortName: "Age", description: "Exact age from birth date — calendar UI", category: "datetime", icon: "🎂" },
  { slug: "days-between-dates", name: "Days Between Dates", shortName: "Days", description: "from=YYYY-MM-DD to=YYYY-MM-DD", category: "datetime", icon: "📅", inputLabel: "Date range", outputLabel: "Days" },
  { slug: "countdown-calculator", name: "Countdown", shortName: "⏳", description: "Time remaining until a target date", category: "datetime", icon: "⏳", inputLabel: "target=YYYY-MM-DD", outputLabel: "Remaining" },
  { slug: "week-number-calculator", name: "ISO Week Number", shortName: "Wk", description: "ISO week & year for any date", category: "datetime", icon: "📆", inputLabel: "date=YYYY-MM-DD", outputLabel: "Week" },
  { slug: "due-date-calculator", name: "Due Date (pregnancy)", shortName: "EDD", description: "EDD from LMP (+280 days, Naegele)", category: "datetime", icon: "🍼", inputLabel: "lmp=YYYY-MM-DD", outputLabel: "EDD" },

  // Dev / design extras (Tool Stack overlap)
  { slug: "contrast-checker", name: "Contrast Checker (WCAG)", shortName: "AA", description: "Foreground & background — WCAG contrast ratio", category: "dev", icon: "👁" },
  { slug: "gradient-generator", name: "CSS Gradient Generator", shortName: "CSS ∇", description: "Linear gradient preview + CSS snippet", category: "dev", icon: "🌈" },
  { slug: "currency-converter", name: "Currency Converter", shortName: "FX", description: "Live rates via Frankfurter (ECB) — amount & currency pair", category: "conversion", icon: "💱" },

  // Browser-based files & XML suite
  {
    slug: "background-remover",
    name: "Background Remover",
    shortName: "BG Remove",
    description: "Remove image backgrounds instantly with AI — runs 100% in your browser, no uploads, no API key",
    category: "image",
    icon: "✂️",
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    shortName: "Resize",
    description: "Resize JPG, PNG, or WebP in the browser — set width & height, optional aspect lock, download result",
    category: "image",
    icon: "🖼",
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    shortName: "Compress",
    description: "Reduce file size with quality control — JPEG / WebP, same dimensions (browser-side)",
    category: "image",
    icon: "🗜",
  },
  {
    slug: "pdf-page-editor",
    name: "PDF Page Editor",
    shortName: "PDF",
    description: "Remove pages or extract selected pages into a new PDF — 100% client-side with pdf-lib",
    category: "dev",
    icon: "📄",
  },
  {
    slug: "xml-suite",
    name: "XML Tools Suite",
    shortName: "XML",
    description: "Validate XML, pretty-print & minify, run XPath queries, and search for strings — all in one place",
    category: "text",
    icon: "〈/",
    inputLabel: "XML document",
    outputLabel: "Result",
  },
  {
    slug: "image-format-converter",
    name: "Image Format Converter",
    shortName: "Img Convert",
    description: "Convert images between PNG, JPEG, and WebP — quality slider, size comparison, download. 100% client-side.",
    category: "image",
    icon: "🔄",
  },
  {
    slug: "svg-optimizer",
    name: "SVG Optimizer",
    shortName: "SVG Opt",
    description: "Paste or upload an SVG — strip Inkscape/Illustrator bloat, comments, and whitespace. Shows size savings.",
    category: "image",
    icon: "✦",
  },
  {
    slug: "exif-viewer",
    name: "EXIF Viewer",
    shortName: "EXIF",
    description: "Upload a JPEG or TIFF photo to read camera model, lens, exposure, GPS coordinates, and all embedded EXIF data.",
    category: "image",
    icon: "📷",
  },
  {
    slug: "http-status-reference",
    name: "HTTP Status Reference",
    shortName: "HTTP Codes",
    description: "Searchable reference for all HTTP status codes — 1xx to 5xx — with descriptions and when to use each.",
    category: "dev",
    icon: "🌐",
  },
  {
    slug: "css-box-shadow",
    name: "CSS Box Shadow Builder",
    shortName: "Box Shadow",
    description: "Build layered box-shadow CSS visually — adjust x/y/blur/spread/color with sliders and copy the CSS.",
    category: "dev",
    icon: "🎨",
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}
