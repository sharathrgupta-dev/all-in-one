export const SITE_URL = "https://devbench.co.in";
export const SITE_NAME = "DevBench";

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
