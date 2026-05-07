# Changelog

All notable changes to DevBench are documented here.

---

## [Unreleased] — 2026-05-07

### Added
- **Unicode Checker** — Per-character codepoint inspector: U+ code, official name, category, script, UTF-8 bytes, HTML entity; highlights invisible/dangerous characters (ZWJ, ZWNJ, RTL override, zero-width)
- **Regex Tester** (full rewrite) — Named capture group display, `d` (indices) flag, color-coded regex explanation strip with token tokenizer, Code Generator (JavaScript / Python / PHP snippets), Quick Reference sidebar (Anchors, Character classes, Quantifiers, Groups, Substitution)
- **CSS Box Shadow Builder** — Multi-layer shadow editor with live preview, slider controls for offset/blur/spread/opacity, Tailwind hint, copy-ready CSS output
- **HTTP Status Reference** — All 57 HTTP codes (1xx–5xx) in searchable accordion, color-coded by range, with description and use-case notes
- **Image Format Converter** — Client-side canvas conversion between PNG, JPEG, WebP; shows % size change, quality slider for JPEG/WebP
- **SVG Optimizer** — 7 configurable passes (comments, metadata, Inkscape/AI data, hidden elements, empty groups, default attrs, whitespace) without shipping SVGO; code/preview toggle with size savings display
- **EXIF Viewer** — Drag-and-drop JPEG/TIFF/HEIC EXIF reader; groups Camera, Settings, Timestamps, GPS (links to Google Maps), Image, Other; dynamic-imported `exifr` to keep off the critical path
- **⌘K Command Palette** — Spotlight-style search across all tools; keyboard nav ↑↓↵, Escape to close; triggered by `Cmd+K` / `Ctrl+K` or the Header button
- **Favourites (Pinned)** — Star any tool card; pinned tools surfaced at the top of the homepage; persisted in `localStorage`
- **Recently Used** — Last 8 tool visits auto-tracked per `localStorage`; shown below pinned tools on unfiltered homepage view
- **Split View in JSON workspace** — Side-by-side JSON input + interactive tree; toggleable via toolbar button
- **JSONPath copy in JSON tree** — Click any node to copy its path; three formats: JSONPath dot notation (`$.a.b[0]`), JSON Pointer RFC 6901 (`/a/b/0`), bracket notation; always-visible path bar; "Copy JSONPath" added to right-click context menu

### Fixed
- Mobile PageSpeed regression (93→74): `ToolSearch` was importing the entire TOOLS array client-side, ballooning TBT on throttled mobile CPUs; moved `tools` as a server-rendered prop to eliminate the client bundle cost

---

## [v0.8] — 2026-05-06

### Added
- JSON-LD structured data (`@type: WebApplication`) on homepage and all tool pages
- Google Tag Manager integration (`G-V6MSPDCYDK`)
- Google AdSense metadata
- Vercel Web Analytics
- Google site-verification metadata
- Privacy policy page with advertising/cookie disclosures

### Changed
- Extensive SEO copy additions across all workspace pages: JSON, JWT Debugger, Diff Checker, Epoch Time, Graph Calculator, API Tester, Code Beautify, Cron Editor
- Tool layout updated: related tools section per tool page
- URL redirect: `/json-formatter` → `/json`

### Fixed
- Viewport meta tag added to layout to prevent mobile zoom issues
- Accessibility: `aria-label` and `aria-pressed` on icon-only buttons in JSON workspace

---

## [v0.7] — 2026-05-05

### Added
- **HTML Preview** — Sandboxed iframe live renderer with optional JS execution
- **Markdown Preview** — Live side-by-side editor with GFM support
- **Regex Tester** (initial) — Live match highlighting, group capture, substitution
- **String Inspector** — Length, bytes, Unicode codepoints (first 120 chars), char frequency, entropy
- **UUID / ULID / Nano ID Generator**
- **Background Remover** — Client-side background removal via `@imgly/background-removal`
- Unit converter, Finance tools (Simple Interest, GST, Discount, Tip, ROI, P&L), Health tools (BMI, BMR, TDEE, Water Intake, Body Fat), Math solvers (Quadratic, Pythagorean, GCD/LCM), Datetime tools (Days Between, Countdown, Week Number, Due Date)
- **QR Code Generator** — Text/URL to QR with download

---

## [v0.6] — 2026-05-05

### Added
- **Code Beautify** workspace — Prettier-based formatter for JS/TS/CSS/HTML, SQL formatter, PDF tools (merge, split, reorder), XML suite
- `pdf-lib` integration for PDF page editor
- Turbopack dev server configuration

---

## [v0.5] — 2026-05-04

### Added
- Initial project structure: Next.js 16, Tailwind CSS v4, shadcn/ui
- JSON workspace (formatter, diff, JSONPath, tree view, YAML↔JSON, CSV↔JSON, JSON→TypeScript, JSON→XML)
- JWT Debugger
- Diff Checker (text + JSON)
- Epoch Time converter
- Graph Calculator (function plotter)
- API Tester (HTTP client with proxy route)
- Cron Editor / parser
- Encoding tools (Base64, URL encode, HTML entities, Hex, Binary, ROT13, Morse)
- Text tools (Case Converter, Word Counter, Slug Generator, Lorem Ipsum, Line Sorter, Find & Replace, Whitespace Normalizer)
- Dev tools (AES-256-GCM, Hash Generator, Color Converter, Password Generator, URL Parser, Base Converter)
- Conversion tools (Temperature, Byte, Unit, Number→Words, Roman Numerals, Timezone, Duration, Percentage, Aspect Ratio)
- Header, Footer, ToolSearch homepage with category filters

---

## [v0.1] — 2026-05-04

- Initial commit / scaffolding
