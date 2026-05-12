# DevBench — runbook

**Audience:** engineers on call, release manager.  
**Repo:** `all-in-one` (DevBench).

## Local development

```bash
npm install
npm run dev
```

- App: `http://localhost:3000` (default Next port).
- Read `AGENTS.md` / Next docs in `node_modules/next/dist/docs/` when changing App Router behavior (project convention).

## Build & quality gates

```bash
npm run build
```

- Fails on TypeScript errors and Next build errors.
- Run before merging significant UI or config changes.

Optional (if present in `package.json`):

```bash
npm run lint
npm test
```

## Environment variables

- Document **required** and **optional** vars in this section as they are introduced (Vercel dashboard + `.env.local` for local).
- Never commit secrets. Use Vercel env for production/preview.

## Deploy (Vercel)

1. **Branch → PR** — CI / preview deployment per team practice.
2. **Production** — merge to default branch; Vercel promotes per project settings.
3. **Verify after deploy**
   - Open `/`, `/json`, `/graph-calculator`, `/pdf` — smoke navigation and one primary action each.
   - Confirm GTM/ads load only if expected (ad blockers may hide them).

## Rollback

1. Vercel dashboard → **Deployments** → select last known good → **Promote to Production**.
2. If bad change is config-only — revert commit and redeploy.

## CSP / security header change checklist

When editing `next.config.ts` CSP or headers:

1. Staging or preview URL: load homepage, tool with canvas, tool with clipboard, API tester (if applicable).
2. Browser console: no unexpected CSP violations for critical paths.
3. Update `docs/DEVBENCH-THREAT-MODEL.md` §6–§7 if allowlists change.

## Incident pointers

| Symptom | First checks |
|---------|----------------|
| **502/504 on `/api/proxy`** | Upstream timeout (30s); upstream down; body size. |
| **CSP blocks feature** | Console violation → adjust directive or remove inline script. |
| **Site blank after deploy** | SW cache (rare); hard refresh; verify `/_next/static` responses. |
| **Enterprise users blocked** | Category / TLS — product + IT; not fixed by app redeploy alone. |

## Useful paths

- CSP & headers: `next.config.ts`
- API proxy: `src/app/api/proxy/route.ts`
- Threat model: `docs/DEVBENCH-THREAT-MODEL.md`
