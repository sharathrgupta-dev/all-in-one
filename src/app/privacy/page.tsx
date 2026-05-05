import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Tools and inputs.</strong> Core
            DevBench utilities process your input locally in the browser. We do
            not operate a backend that stores your pasted JSON, tokens, or API
            bodies for those tools.
          </p>
          <p>
            <strong className="text-foreground">Contact.</strong> The{" "}
            <Link href="/contact" className="text-accent hover:underline">
              contact page
            </Link>{" "}
            opens your email client with a pre-filled message; we do not receive
            that content unless you send the email.
          </p>
          <p>
            <strong className="text-foreground">Hosting & logs.</strong> If you
            deploy this app on a host (e.g. Vercel), the provider may collect
            standard access logs (URLs, IPs, timestamps). That is independent of
            DevBench&apos;s tool logic.
          </p>
          <p>
            Questions?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Reach out
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
