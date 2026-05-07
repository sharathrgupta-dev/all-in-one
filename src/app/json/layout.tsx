import type { Metadata } from "next";
import Footer from "@/components/Footer";
import ToolFaqSection from "@/components/tools/ToolFaqSection";
import JsonLd from "@/components/JsonLd";
import { TOOL_FAQS } from "@/lib/tool-faqs";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const JSON_TITLE = "JSON Formatter, Validator & Toolkit";
const JSON_DESC =
  "Format and minify JSON, tree view, diff, YAML/CSV/TOML export, schema validation, encrypt, NDJSON, table mode — full JSON workspace in the browser.";

export const metadata: Metadata = {
  title: JSON_TITLE,
  description: JSON_DESC,
  keywords: [
    "JSON formatter",
    "JSON validator",
    "JSON diff",
    "JSON to YAML",
    "JSON schema validator",
  ],
  alternates: { canonical: `${SITE_URL}/json` },
  ...socialMetadata({
    title: JSON_TITLE,
    description: JSON_DESC,
    canonicalPath: "/json",
    ogImageUrl: `${SITE_URL}/json/opengraph-image`,
    ogImageAlt: `${JSON_TITLE} | DevBench`,
  }),
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSON Formatter & Validator",
  url: `${SITE_URL}/json`,
  description: JSON_DESC,
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

const jsonFaqs = TOOL_FAQS["json"];
const faqSchema =
  jsonFaqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: jsonFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      }
    : null;

export default function JsonToolkitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={webAppSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      {children}
      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          JSON Toolkit — everything JSON in one workspace
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The DevBench <strong>JSON workspace</strong> is a full-featured,
          browser-based JSON editor. Format and validate JSON with real-time
          error highlighting, explore any object in the interactive tree view,
          compare two JSON documents with structural diff, and export to YAML,
          CSV, TypeScript interfaces, XML, or TOML in one click. All processing
          happens client-side — your JSON never leaves your device.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Features</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Format &amp; minify</strong> — pretty-print with
            configurable indent (2 or 4 spaces) or minify to a single line
          </li>
          <li>
            <strong>Validate</strong> — syntax errors reported with line and
            column numbers; common mistakes auto-fixed on request
          </li>
          <li>
            <strong>Tree view</strong> — collapse and expand nested objects and
            arrays; copy any subtree as JSON
          </li>
          <li>
            <strong>JSON Diff</strong> — compare two JSON documents and
            highlight structural differences
          </li>
          <li>
            <strong>Export</strong> — convert to YAML, CSV, TypeScript
            interfaces, XML, TOML, or Base64
          </li>
          <li>
            <strong>JSON Schema validation</strong> — paste a schema to
            validate your document against it
          </li>
          <li>
            <strong>AES-256-GCM encryption</strong> — encrypt sensitive JSON
            payloads with a password, client-side only
          </li>
          <li>
            <strong>NDJSON / JSON Lines</strong> — parse and format newline-delimited
            JSON streams
          </li>
        </ul>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          What is JSON?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          JSON (JavaScript Object Notation) is a lightweight, human-readable
          data interchange format defined in{" "}
          <a
            href="https://www.rfc-editor.org/rfc/rfc8259"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="text-accent hover:underline"
          >
            RFC 8259
          </a>
          . It supports six value types: strings, numbers, booleans,{" "}
          <code className="font-mono text-xs">null</code>, arrays, and objects.
          JSON has become the de-facto standard for REST API responses, config
          files, database documents (MongoDB, Firestore), and data exchange
          between services.
        </p>
      </section>
      <ToolFaqSection slug="json" />
      <Footer />
    </>
  );
}
