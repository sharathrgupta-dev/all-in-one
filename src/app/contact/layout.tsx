import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — DevBench",
  description:
    "Reach out about bugs, tool ideas, or feedback. Messages open in your mail client — nothing is stored on our servers.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
