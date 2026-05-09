export interface ToolPageContent {
  /** 60 chars max — replaces generic title in generateMetadata */
  title: string;
  /** 150–160 chars — replaces generic meta description */
  metaDescription: string;
  /** 60–80 words — displayed in the hero below the short description */
  openingParagraph: string;
}

export const TOOL_PAGE_CONTENT: Record<string, ToolPageContent> = {
  "base64-encode": {
    title: "Base64 Encoder — Free Online Tool",
    metaDescription:
      "Free online Base64 encoder. Convert text or files to Base64 with full UTF-8 support. Decode Base64 back to text instantly. No signup. Runs 100% in your browser.",
    openingParagraph:
      "Base64 Encode converts any text or binary data to Base64 format entirely in your browser — nothing is uploaded to a server. Paste text or load a file, choose between standard Base64 or URL-safe Base64URL, and get the encoded string with the byte count and size ratio in real time. Supports full UTF-8 including emoji and non-Latin scripts. Decode Base64 back to readable text in one click.",
  },

  "base64-decode": {
    title: "Base64 Decoder — Free Online Tool",
    metaDescription:
      "Decode Base64 strings back to plain text or binary instantly. Full UTF-8 support, URL-safe Base64URL input accepted. No signup. Runs 100% in your browser.",
    openingParagraph:
      "Base64 Decode reverses Base64-encoded strings back to readable text or raw binary data entirely in your browser. Paste any Base64 or Base64URL string — including those with or without padding — and the decoded output appears instantly. Useful for decoding JWT payloads, API response tokens, email attachments, and data URIs. Nothing is sent to a server.",
  },

  "regex-tester": {
    title: "Regex Tester — Test Regular Expressions Online",
    metaDescription:
      "Test regex online with live match highlighting, group captures, and substitution preview. JavaScript RegExp with all flags. No signup, 100% in your browser.",
    openingParagraph:
      "Regex Tester tests JavaScript regular expressions against any input in real time. Type your pattern, pick the flags you need (g, i, m, s, u, v), and every match is highlighted instantly with colour-coded groups, named captures, and exact index positions. Use the Substitution tab to preview replace operations, the Code tab to export snippets for JavaScript, Python, PHP, or Go, and the Pattern Library to load 30 built-in example patterns.",
  },

  "uuid-generator": {
    title: "UUID / ULID / Nano ID Generator — Free Online Tool",
    metaDescription:
      "Generate UUID v4, ULID, and Nano ID online instantly. Bulk generation, multiple formats, copy to clipboard. No signup. Runs 100% in your browser.",
    openingParagraph:
      "UUID Generator creates RFC 4122-compliant UUID v4, time-sortable ULID, and URL-safe Nano ID values in one click. Generate a single identifier or up to 1 000 in bulk, toggle between hyphenated and uppercase formats, and copy everything to the clipboard at once. All values are created using the browser's cryptographically secure random number generator — no server call is made and the IDs are never logged.",
  },

  "hash-generator": {
    title: "Hash Generator — MD5, SHA-1, SHA-256 Online",
    metaDescription:
      "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes online. Hash any text or file instantly, compare hashes, client-side only. No signup. Runs 100% in your browser.",
    openingParagraph:
      "Hash Generator computes MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes of any text or file entirely in your browser using the Web Crypto API. Paste a string or upload a file, select the algorithm, and the hash digest appears instantly in hex or Base64 format. Use the compare field to verify a hash matches an expected value — useful for checking download integrity or comparing password hashes.",
  },

  "password-generator": {
    title: "Secure Password Generator — Free Online Tool",
    metaDescription:
      "Generate strong, random passwords with custom length, character sets, and entropy. Copy instantly. No signup. Runs 100% in your browser — passwords are never sent anywhere.",
    openingParagraph:
      "Password Generator creates cryptographically strong random passwords using your browser's secure random number generator — nothing is ever transmitted or stored. Choose the length (8–128 characters), toggle uppercase, lowercase, digits, and symbols, and exclude ambiguous characters like O, 0, I, and l. The entropy meter shows how long a brute-force attack would take to crack the generated password.",
  },

  "url-encode": {
    title: "URL Encoder — Percent-Encode URLs Online",
    metaDescription:
      "Percent-encode URLs and query strings online. Encode special characters, decode percent-encoded strings, and parse URL components. No signup, 100% in your browser.",
    openingParagraph:
      "URL Encode percent-encodes any text for safe use in URLs and query strings, converting characters like spaces, &, =, and non-ASCII to their %XX equivalents. Paste a full URL or just a query parameter value, choose between full URL encoding or component encoding, and copy the safe output instantly. Decode percent-encoded strings back to readable text with one click. Runs entirely in your browser.",
  },

  "string-inspector": {
    title: "String Inspector — Analyse Text Online",
    metaDescription:
      "Inspect any string: character count, byte length, Unicode points, line count, entropy, and invisible characters. No signup. Runs 100% in your browser.",
    openingParagraph:
      "String Inspector analyses any text and reports character count, byte length (UTF-8 / UTF-16), word count, line count, unique character count, and Shannon entropy. It lists every Unicode code point with its name, category, and script — making it easy to spot invisible characters, zero-width spaces, or mixed-script homoglyphs that could cause subtle bugs in password or URL handling.",
  },

  "json-formatter": {
    title: "JSON Formatter & Validator — Free Online Tool",
    metaDescription:
      "Format, validate, and minify JSON online instantly. Syntax errors highlighted with line/column. Tree view, YAML/CSV conversion. No signup, 100% in your browser.",
    openingParagraph:
      "JSON Formatter validates and pretty-prints any JSON in real time — paste minified JSON and get a readable, indented structure with syntax errors highlighted at the exact line and column. Switch to the interactive tree view to expand and collapse nested objects and arrays, or use the toolbar to minify, convert to YAML, convert to CSV, generate TypeScript interfaces, or diff two JSON documents side by side. Nothing leaves your browser.",
  },

  "url-decode": {
    title: "URL Decoder — Percent-Decode Online",
    metaDescription:
      "Decode percent-encoded URLs and query strings online instantly. Handles %20, %26, UTF-8 multi-byte sequences, and form-encoded + signs. No signup, 100% in your browser.",
    openingParagraph:
      "URL Decode converts percent-encoded strings back to readable text instantly — %20 becomes a space, %2F becomes a slash, multi-byte UTF-8 sequences decode to their correct Unicode characters. Paste any encoded URL, query parameter, or API response value and get the human-readable version in one click. Optionally decode + as space for HTML form data. Runs entirely in your browser with no server calls.",
  },

  "text-diff": {
    title: "Text Diff Checker — Compare Text Online",
    metaDescription:
      "Compare two text blocks side by side online. Added and deleted lines highlighted instantly using the Myers diff algorithm. No signup, 100% in your browser.",
    openingParagraph:
      "Text Diff compares two blocks of text and highlights every addition and deletion using the Myers diff algorithm — the same algorithm Git uses. Paste the original text on the left and the updated text on the right, and changes appear instantly with added lines in green and deleted lines in red. Toggle whitespace-only changes, switch between side-by-side and unified views, and copy the diff output as a standard patch.",
  },

  "html-to-jsx": {
    title: "HTML to JSX Converter — Free Online Tool",
    metaDescription:
      "Convert HTML to JSX online instantly. Handles class→className, for→htmlFor, inline styles, self-closing tags, and event attributes. No signup, 100% in your browser.",
    openingParagraph:
      "HTML to JSX converts raw HTML to React-compatible JSX automatically — renaming class to className, for to htmlFor, converting inline style strings to objects, self-closing void elements, camelCasing event attributes, and wrapping HTML comments in JSX syntax. Paste HTML from a Figma export, email template, or any web page and copy the ready-to-use JSX output directly into your React component.",
  },

  "aes-encrypt-decrypt": {
    title: "AES-256 Encrypt & Decrypt — Free Online Tool",
    metaDescription:
      "Encrypt and decrypt text with AES-256-GCM in your browser. PBKDF2 key derivation, authenticated encryption. No signup, no server — 100% client-side.",
    openingParagraph:
      "AES Encrypt encrypts and decrypts text using AES-256-GCM — the same algorithm used by TLS 1.3 and Signal — entirely in your browser via the Web Crypto API. Enter your plaintext and a password, and the tool derives a 256-bit key using PBKDF2 with 310,000 iterations and a random salt. GCM mode provides authenticated encryption, so any tampering with the ciphertext is detected on decryption. Nothing is ever sent to a server.",
  },

  "qr-code": {
    title: "QR Code Generator — Free Online Tool",
    metaDescription:
      "Generate QR codes from any text or URL online. Choose error correction level, size, and download as PNG or SVG. No signup, 100% in your browser.",
    openingParagraph:
      "QR Code Generator creates a scannable QR code from any text, URL, vCard, or Wi-Fi credentials instantly in your browser. Adjust the error correction level (L to H), output size, and foreground and background colours. Download the result as a high-resolution PNG for web use or a scalable SVG for print at any size. All processing is client-side — no data leaves your browser.",
  },

  "curl-to-fetch": {
    title: "cURL to JavaScript Fetch Converter",
    metaDescription:
      "Convert cURL commands to JavaScript fetch() calls online. Handles headers, body, auth, and common flags. No signup, 100% in your browser.",
    openingParagraph:
      "cURL to Fetch converts any cURL command — including those copied from browser DevTools — into the equivalent JavaScript fetch() call with all headers, HTTP method, request body, and authentication translated automatically. Handles -H, -d, -X, -u, and --json flags. The output works in both browser JavaScript and Node.js 18+ without any extra dependencies.",
  },

  "url-parser": {
    title: "URL Parser — Break Down URL Components Online",
    metaDescription:
      "Parse any URL into scheme, host, port, path, query parameters, and fragment. Decoded key-value table for query strings. No signup, 100% in your browser.",
    openingParagraph:
      "URL Parser breaks any URL into its labelled components — scheme, host, port, path, query string, and fragment — and displays each part in a structured table. Query parameters are listed as individual decoded key-value pairs. Useful for debugging OAuth redirect URLs, webhook endpoints, API base paths, and complex query strings that are hard to read as a single URL string.",
  },

  "base-converter": {
    title: "Number Base Converter — Decimal, Hex, Binary, Octal",
    metaDescription:
      "Convert numbers between decimal, hexadecimal, binary, and octal instantly. Two-way conversion, copy to clipboard. No signup, 100% in your browser.",
    openingParagraph:
      "Base Converter translates integers between decimal (base 10), hexadecimal (base 16), binary (base 2), and octal (base 8) with all representations updating simultaneously as you type in any field. Essential for working with memory addresses, Unix file permissions, bitwise operations, colour codes, and low-level hardware registers. Input accepts standard prefixes (0x for hex, 0b for binary) and ignores spaces between digit groups.",
  },

  "markdown-preview": {
    title: "Markdown Preview Editor — Live GFM Renderer",
    metaDescription:
      "Live side-by-side Markdown editor with GitHub Flavored Markdown rendering. Tables, task lists, code blocks, strikethrough. Copy HTML output. No signup.",
    openingParagraph:
      "Markdown Preview is a split-pane editor that renders GitHub Flavored Markdown (GFM) in real time alongside the source. Write on the left, see the rendered result on the right as you type. Supports all GFM extensions — tables, task lists, strikethrough, fenced code blocks with language tags, and auto-linked URLs. Copy the rendered HTML output for pasting into a CMS, or download the Markdown source as a .md file.",
  },

  "salary-hike-calculator": {
    title: "Salary Hike Calculator — Raise % and Monthly Difference",
    metaDescription:
      "Compare old and new salary: percent hike, total increase, and per-month difference. Annual or monthly input. Free, runs in your browser — no data stored.",
    openingParagraph:
      "Salary Hike Calculator shows the percentage change, absolute increase (or decrease), and monthly difference between your old and new package. Switch between annual and monthly figures to match how your offer letter is written. Handy for comparing counter-offers, promotion letters, and cost-of-living adjustments before you accept.",
  },

  "semver-compare": {
    title: "SemVer Comparator — Compare npm Semantic Versions Online",
    metaDescription:
      "Compare two semantic versions like npm: validate, prerelease-aware ordering, semver.diff major/minor/patch. Free browser tool — nothing uploaded.",
    openingParagraph:
      "SemVer Comparator evaluates two version strings with the same semantics as npm and Node’s semver package — including prereleases and v-prefix normalization. See whether A is older or newer than B, the numeric compare result, and whether the difference is a major, minor, or patch bump. Use it when triaging dependency upgrades, Git tags, or package.json ranges.",
  },

  "chmod-calculator": {
    title: "chmod Calculator — Octal ↔ Symbolic Permissions",
    metaDescription:
      "Convert Unix chmod octals (755, 0644) to rwx notation and back. Supports ls -l output and setuid/setgid/sticky. Runs in your browser.",
    openingParagraph:
      "chmod Calculator translates between numeric octal modes and symbolic rwx strings for user, group, and others. Paste a mode like 755 or rwxr-xr-x, or a full ls -l permission field; four-digit octals show setuid, setgid, and sticky bits. Handy for Dockerfiles, deployment scripts, and infra-as-code when you need to double-check permission masks.",
  },

  "dotenv-parser": {
    title: ".env Parser — Dotenv to JSON Online",
    metaDescription:
      "Parse .env files into JSON in the browser: KEY=value lines, export prefix, duplicate-key warnings. No upload — safe for secrets snippets.",
    openingParagraph:
      ".env Parser reads dotenv-style configuration from your clipboard: it skips comments and blank lines, strips quotes, flags duplicate keys (last wins), and emits compact JSON for all variables. Use it to validate env blocks before committing .env.example files, compare environments, or document required variables — all locally in the browser.",
  },

  "image-to-pdf": {
    title: "Image to PDF — JPG, PNG, WebP to One PDF (Free, Browser-Only)",
    metaDescription:
      "Merge images into a single A4 PDF: reorder pages, PNG/JPEG/WebP/GIF supported. Runs entirely in your browser — nothing uploaded to DevBench.",
    openingParagraph:
      "Image to PDF turns any sequence of photos or screenshots into one print-ready document. Drop files or pick them from disk, drag to reorder pages, and download a PDF where each image fits an A4 page with margins. Raster formats decode locally; large bitmaps are scaled so embedding stays reliable — ideal for scans, invoices, and boards.",
  },
};
