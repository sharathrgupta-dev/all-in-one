import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diff Checker — Compare Text Online | DevBench",
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
  alternates: { canonical: "https://devbench.co.in/diff-checker" },
};

export default function DiffCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
