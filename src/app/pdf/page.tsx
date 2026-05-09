import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PdfToolsHub from "@/components/pdf/PdfToolsHub";
import { SITE_URL } from "@/lib/social-metadata";
import { socialMetadata } from "@/lib/social-metadata";

const TITLE = "PDF Tools — Image to PDF, Page Editor";
const DESC =
  "Free PDF utilities in your browser: combine images into one PDF, remove or extract pages. No uploads to DevBench — processing stays on your device.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  keywords: ["PDF", "image to pdf", "merge images pdf", "pdf pages", "browser pdf"],
  alternates: { canonical: `${SITE_URL}/pdf` },
  ...socialMetadata({
    title: TITLE,
    description: DESC,
    canonicalPath: "/pdf",
  }),
};

export default function PdfWorkspacePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PdfToolsHub />
      </main>
      <Footer />
    </>
  );
}
