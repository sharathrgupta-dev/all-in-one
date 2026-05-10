import type { Metadata } from "next";

export const SITE_URL = "https://www.devbench.co.in";

type SocialOpts = {
  title: string;
  description: string;
  canonicalPath: string;
  /** Full URL or path starting with / — defaults to ${SITE_URL}/opengraph-image */
  ogImageUrl?: string;
  ogImageAlt?: string;
};

/**
 * Page-specific Open Graph + Twitter cards (canonical URL per route).
 */
export function socialMetadata(opts: SocialOpts): Pick<Metadata, "openGraph" | "twitter"> {
  const url = `${SITE_URL}${opts.canonicalPath.startsWith("/") ? opts.canonicalPath : `/${opts.canonicalPath}`}`;
  const imageUrl =
    opts.ogImageUrl ??
    `${SITE_URL}/opengraph-image`;
  const ogAlt = opts.ogImageAlt ?? `${opts.title} | DevBench`;

  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "DevBench",
      type: "website",
      locale: "en_US",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      site: "@devbench",
      creator: "@devbench",
      images: [imageUrl],
    },
  };
}
