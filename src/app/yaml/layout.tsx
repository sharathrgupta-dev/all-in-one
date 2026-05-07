import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "YAML Formatter, Validator & Converter | DevBench",
  description:
    "Format and validate YAML with line-level error highlighting. Convert YAML to JSON and JSON to YAML instantly. Supports YAML 1.2, multi-document streams, and anchors.",
  keywords: ["yaml formatter", "yaml validator", "yaml to json", "json to yaml", "online yaml editor", "yaml checker", "yaml lint"],
  alternates: { canonical: "https://devbench.co.in/yaml" },
};

export default function YamlLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          YAML Formatter, Validator &amp; Converter
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The DevBench <strong>YAML workspace</strong> lets you format, validate,
          lint, and convert YAML entirely in your browser — nothing is sent to a
          server. Paste messy YAML and the formatter re-indents it with consistent
          2-space indentation, normalises line endings, and collapses excess blank
          lines. The validator reports syntax errors with exact line and column
          numbers, and the linter flags common issues such as tabs, trailing
          whitespace, lines over 120 characters, and duplicate keys.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Features</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li><strong>Format</strong> — pretty-print YAML with 2-space indentation and clean blank lines</li>
          <li><strong>Validate &amp; Lint</strong> — syntax errors, tab usage, long lines, duplicate keys with line numbers</li>
          <li><strong>Auto-Fix</strong> — one click removes tabs, trailing whitespace, and CRLF endings</li>
          <li><strong>YAML → JSON</strong> — convert any YAML document to formatted JSON</li>
          <li><strong>JSON → YAML</strong> — convert JSON back to clean YAML</li>
          <li><strong>Multi-document</strong> — handles <code className="font-mono text-xs">---</code> separated YAML streams</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">What is YAML?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          YAML (YAML Ain&apos;t Markup Language) is a human-readable data serialisation
          format widely used for configuration files — Kubernetes manifests, Docker
          Compose, GitHub Actions, Ansible playbooks, and countless CI/CD pipelines.
          Unlike JSON, YAML allows comments, multiline strings, anchors
          (<code className="font-mono text-xs">&amp;</code>), and aliases
          (<code className="font-mono text-xs">*</code>) for reuse. Indentation
          (spaces only — never tabs) defines structure, making the format clean to
          read but easy to break if edited carelessly.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">YAML vs JSON</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>YAML is a superset of JSON — valid JSON is also valid YAML 1.2</li>
          <li>YAML supports comments (<code className="font-mono text-xs"># comment</code>); JSON does not</li>
          <li>YAML uses indentation for structure; JSON uses braces and brackets</li>
          <li>YAML anchors allow values to be reused without repetition</li>
          <li>JSON is generally safer for machine-to-machine communication; YAML excels in human-edited config files</li>
        </ul>
      </section>
      <Footer />
    </>
  );
}
