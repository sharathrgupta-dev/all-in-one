import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Linux & Server Commands Cheat Sheet";
const description =
  "Searchable CLI reference: basics, permissions, processes, networking, Docker, Kubernetes, disk/memory, and troubleshooting — with copy-ready examples. Runs in your browser.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "linux cheat sheet",
    "bash commands",
    "docker commands",
    "kubectl cheat sheet",
    "server troubleshooting",
    "journalctl",
    "ssh",
  ],
  alternates: { canonical: `${SITE_URL}/linux-cheatsheet` },
  ...socialMetadata({ title, description, canonicalPath: "/linux-cheatsheet" }),
};

export default function LinuxCheatsheetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-2 mb-2">About this cheat sheet</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Commands are generic patterns — paths, port numbers, and unit names are examples. Always confirm{" "}
          <strong className="text-foreground">destructive</strong> operations (<code className="font-mono text-xs">rm -rf</code>,{" "}
          <code className="font-mono text-xs">kill -9</code>, <code className="font-mono text-xs">docker system prune</code>) on
          staging first. Production servers differ by distro and policy — use your runbooks where they conflict.
        </p>
      </section>
      <Footer />
    </>
  );
}
