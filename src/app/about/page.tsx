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
            DevBench is an all-in-one developer toolkit that runs entirely in
            your browser. Format JSON, encode data, compare text, debug JWTs,
            test HTTP APIs, edit cron expressions, beautify code, and use
            dozens of smaller converters — without signing up and without
            sending your payloads to our servers.
          </p>
          <p>
            We focus on speed and privacy: heavy work stays on your machine,
            using Web Crypto and modern JS where needed.
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
