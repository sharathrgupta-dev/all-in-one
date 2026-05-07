import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "About";
const description =
  "DevBench is a client-side developer toolkit: JSON, encoding, diff, JWT, API testing, math suite, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  ...socialMetadata({ title, description, canonicalPath: "/about" }),
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
