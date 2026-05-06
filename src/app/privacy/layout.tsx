import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DevBench",
  description:
    "DevBench privacy policy — all tools run client-side, Google AdSense advertising disclosure, cookie usage, and hosting information.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
