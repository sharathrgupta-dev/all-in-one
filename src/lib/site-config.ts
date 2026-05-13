export const SITE_URL = "https://www.devbench.co.in";
export const SITE_NAME = "DevBench";

/** Subdomain that serves only the code playground (same Vercel project; see `src/middleware.ts`). */
export const PLAYGROUND_HOST = "playground.devbench.co.in";

export const PLAYGROUND_ORIGIN = `https://${PLAYGROUND_HOST}`;

/** Normalised hostname without port (for middleware / server layouts). */
export function normaliseHost(hostHeader: string | null): string {
  return (hostHeader ?? "").split(":")[0].trim().toLowerCase();
}

/**
 * When the UI is served on `playground.*`, internal nav should hit `www` except
 * the playground entry itself, which stays on `/` of the playground host.
 */
export function resolveToolHref(path: string, externalOriginPrefix: string): string {
  if (!externalOriginPrefix) return path;
  if (path === "/playground" || path === "/playground/") return "/";
  if (path.startsWith("/")) {
    const base = externalOriginPrefix.replace(/\/$/, "");
    return `${base}${path}`;
  }
  return path;
}

function envEmail(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" && v.includes("@") ? v : undefined;
}

/** Public inbox for the Contact page (mailto). Override with NEXT_PUBLIC_CONTACT_EMAIL in `.env.local`. */
export const SITE_CONTACT_EMAIL =
  envEmail("NEXT_PUBLIC_CONTACT_EMAIL") ?? "devbenchcare@gmail.com";

export const SITE_PRIVACY_EMAIL =
  envEmail("NEXT_PUBLIC_PRIVACY_EMAIL") ?? SITE_CONTACT_EMAIL;

export const SITE_PARTNER_EMAIL =
  envEmail("NEXT_PUBLIC_PARTNER_EMAIL") ?? SITE_CONTACT_EMAIL;
