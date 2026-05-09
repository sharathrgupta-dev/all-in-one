import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex-1 w-full max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">About DevBench</h1>
        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            DevBench is a calm, browser-first toolkit for everyday work: tidy up
            JSON and YAML, merge or compress PDFs, run HTTP checks, spin through
            finance and unit converters, and handle dozens of small tasks — no
            account, and nothing leaves your device unless you choose to export
            or share it.
          </p>
          <p>
            We keep things fast and private: the heavy lifting runs locally with
            Web Crypto and modern JavaScript when it helps.
          </p>
          <p>
            Have feedback or a tool idea?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
