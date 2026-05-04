import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Beautify — Formatters, Validators, Converters | DevForge",
  description:
    "Beautify and format JSON, XML, YAML, CSS, SQL, HTML; Base64 and hex tools; hash generators, JWT decode, diff, and more — all client-side in your browser.",
  keywords: [
    "JSON beautifier",
    "code formatter",
    "XML formatter",
    "Base64 decode",
    "SQL formatter",
    "online formatter",
  ],
};

export default function CodeBeautifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
