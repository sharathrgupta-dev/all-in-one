import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Text Diff Checker — Compare Two Texts Online";
const description =
  "Compare two texts side-by-side or unified. Find additions and deletions with line and character highlighting. Ignore whitespace, regex search — private, client-side diff tool.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "diff checker",
    "text compare",
    "compare text online",
    "text diff",
    "difference finder",
    "diffchecker alternative",
  ],
  alternates: { canonical: `${SITE_URL}/diff-checker` },
  ...socialMetadata({ title, description, canonicalPath: "/diff-checker" }),
};

export default function DiffCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
