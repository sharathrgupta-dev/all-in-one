import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — DevBench",
  description:
    "How DevBench handles data: client-side tools, no account required, and what minimal telemetry might mean in the future.",
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
