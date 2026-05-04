import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Tools — Format, Validate, Transform & Diff | DevForge",
  description:
    "Format and minify JSON, tree view, diff, YAML/CSV/TOML export, schema validation, encrypt, NDJSON, table mode — full JSON workspace in the browser.",
  keywords: [
    "JSON formatter",
    "JSON validator",
    "JSON diff",
    "JSON to YAML",
    "JSON schema validator",
  ],
};

export default function JsonToolkitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
