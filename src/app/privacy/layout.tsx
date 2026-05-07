import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Privacy Policy";
const description =
  "DevBench privacy policy — all tools run client-side, Google AdSense advertising disclosure, cookie usage, and hosting information.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/privacy` },
  ...socialMetadata({ title, description, canonicalPath: "/privacy" }),
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
