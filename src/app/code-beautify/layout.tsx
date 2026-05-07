import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Beautify — Formatters, Validators, Converters | DevBench",
  description:
    "Online beautifiers for HTML, CSS, JavaScript, TypeScript, TSX, JSON, Markdown, YAML, GraphQL, XML, SQL (Prettier / sql-formatter), plus Python indent cleanup — all client-side.",
  keywords: [
    "HTML formatter",
    "CSS beautifier",
    "JavaScript prettifier",
    "Python indent",
    "SQL formatter",
    "JSON beautifier",
    "online formatter",
  ],
  alternates: { canonical: "https://devbench.co.in/code-beautify" },
};

export default function CodeBeautifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
