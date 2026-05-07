import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Contact";
const description =
  "Reach out about bugs, tool ideas, or feedback. Messages open in your mail client — nothing is stored on our servers.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/contact` },
  ...socialMetadata({ title, description, canonicalPath: "/contact" }),
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
