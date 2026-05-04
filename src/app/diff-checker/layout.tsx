import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diff Checker — Compare Text Online | DevForge",
  description:
    "Compare two texts side-by-side or unified. Find additions and deletions with line and character highlighting. Ignore whitespace, regex search — private, client-side diff tool.",
  keywords: [
    "diff checker",
    "text compare",
    "compare text online",
    "text diff",
    "difference finder",
    "diffchecker alternative",
  ],
};

export default function DiffCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
