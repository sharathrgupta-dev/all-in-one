import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Code Beautify — Formatters, Validators, Converters";
const description =
  "Online beautifiers for HTML, CSS, JavaScript, TypeScript, TSX, JSON, Markdown, YAML, GraphQL, XML, SQL (Prettier / sql-formatter), plus Python indent cleanup — all client-side.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "HTML formatter",
    "CSS beautifier",
    "JavaScript prettifier",
    "Python indent",
    "SQL formatter",
    "JSON beautifier",
    "online formatter",
    "code beautifier",
    "Prettier online",
  ],
  alternates: { canonical: `${SITE_URL}/code-beautify` },
  ...socialMetadata({ title, description, canonicalPath: "/code-beautify" }),
};

export default function CodeBeautifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
