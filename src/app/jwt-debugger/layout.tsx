import type { Metadata } from "next";
import { TOOL_FAQS } from "@/lib/tool-faqs";
import ToolFaqSection from "@/components/tools/ToolFaqSection";
import JsonLd from "@/components/JsonLd";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const JWT_TITLE = "JWT Debugger — Decode, Encode & Verify Tokens";
const JWT_DESC =
  "Free online JWT decoder and encoder. Inspect headers and payloads, verify HMAC signatures (HS256/384/512), see claim breakdown and expiry — runs entirely in your browser.";

export const metadata: Metadata = {
  title: JWT_TITLE,
  description: JWT_DESC,
  keywords: [
    "JWT decoder",
    "JWT encoder",
    "JSON Web Token",
    "verify JWT",
    "jwt.io alternative",
    "decode JWT online",
  ],
  alternates: { canonical: `${SITE_URL}/jwt-debugger` },
  ...socialMetadata({
    title: JWT_TITLE,
    description: JWT_DESC,
    canonicalPath: "/jwt-debugger",
    ogImageUrl: `${SITE_URL}/jwt-debugger/opengraph-image`,
    ogImageAlt: `${JWT_TITLE} | DevBench`,
  }),
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JWT Debugger",
  url: `${SITE_URL}/jwt-debugger`,
  description: JWT_DESC,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  provider: {
    "@type": "Organization",
    name: "DevBench",
    url: SITE_URL,
  },
};

const jwtFaqs = TOOL_FAQS["jwt-debugger"] ?? [];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: jwtFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function JwtDebuggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={webAppSchema} />
      <JsonLd data={faqSchema} />
      {children}
      <ToolFaqSection slug="jwt-debugger" />
    </>
  );
}
