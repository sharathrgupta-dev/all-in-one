# DevBench — architecture snapshot

**Purpose:** Onboard engineers and support security reviews. For threats, see `docs/DEVBENCH-THREAT-MODEL.md`.

## Stack

- **Framework:** Next.js App Router (see repo `package.json` for exact version).
- **Hosting:** Vercel (Fluid Compute / standard deployment — confirm in Vercel dashboard).
- **Styling:** Tailwind CSS v4 patterns (`globals.css`, design tokens).

## Routing model

| Kind | Example | Notes |
|------|---------|--------|
| **Workspaces** | `/json`, `/yaml`, `/pdf`, `/graph-calculator`, … | Multi-tool pages; often `page.tsx` client components with large UI. |
| **Single tools** | `/tools/[slug]` | Dynamic route per tool registry entry. |
| **API** | `POST /api/proxy` | Server-side; see threat model. |

**Workspace discovery:** `src/lib/devbench-workspaces.ts` — single list for command palette, slugs → workspace hrefs (`TOOL_SLUG_TO_WORKSPACE`), etc.

**Shareable state:**

- Engine tools may use `#state=` (see `shareable-tool-state` usage in repo).
- JSON workspace uses **`#jw=`** (`src/lib/json-workspace-share.ts`) — distinct payload format.

## Layout composition

- **`src/app/layout.tsx`** — Root HTML, fonts, GTM/AdSense script tags, global `Header`, command palette, service worker registration, analytics.
- **Per-route layouts** — e.g. `graph-calculator/layout.tsx` adds SEO copy + `Footer` below the page.

## Client-only vs network

- **Default:** Tools run in the browser; no data sent to DevBench servers.
- **Exceptions:** API tester via `/api/proxy`; any future `app/api/*` must be documented in the threat model.

## PWA / offline

- **`public/sw.js`** — Caches `/_next/static/*` only; avoids caching HTML/RSC.
- **`ServiceWorkerRegister`** — Registers in production only (`src/components/ServiceWorkerRegister.tsx`).

## Key directories

| Path | Role |
|------|------|
| `src/app/` | Routes, layouts, metadata |
| `src/components/` | Shared UI, tools, lazy palette |
| `src/lib/` | Registries, analytics helpers, workspace libs |
| `next.config.ts` | CSP, security headers, redirects |

## Layout / flex conventions (workspaces)

Full-height tool pages use **`flex flex-col`** with:

- **`shrink-0`** on fixed chrome (site header now includes `shrink-0` in `Header.tsx`).
- **`flex-1 min-h-0 overflow-hidden`** on scrollable main regions so flex children do not overlap headers or trap pointer events.

When adding a new workspace, copy this pattern from `json` or `graph-calculator` pages after layout review.
