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
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>
        <div className="mt-6 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Tools and inputs.</strong> All
            DevBench utilities process your input locally in the browser. We do
            not operate a backend that stores your pasted JSON, tokens, API
            bodies, or any other tool input. Your data never leaves your device.
          </p>
          <p>
            <strong className="text-foreground">Advertising.</strong> This site
            uses Google AdSense to display advertisements. Google and its
            partners may use cookies and similar technologies to show you
            personalised ads based on your browsing history across sites. You
            can opt out of personalised advertising at{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              adssettings.google.com
            </a>
            , or visit{" "}
            <a
              href="https://www.aboutads.info/choices"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              aboutads.info
            </a>{" "}
            to learn more. DevBench does not control the cookies set by Google
            AdSense.
          </p>
          <p>
            <strong className="text-foreground">Cookies.</strong> DevBench
            itself sets one cookie — your light/dark theme preference stored in{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              localStorage
            </code>
            . No tracking cookies are set by DevBench directly.
          </p>
          <p>
            <strong className="text-foreground">Contact.</strong> The{" "}
            <Link href="/contact" className="text-accent hover:underline">
              contact page
            </Link>{" "}
            opens your email client with a pre-filled message. We do not receive
            that content unless you send the email.
          </p>
          <p>
            <strong className="text-foreground">Hosting & logs.</strong> DevBench
            is hosted on Vercel, which may collect standard access logs (IP
            address, URLs, timestamps) as part of normal server operation. See{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Vercel&apos;s Privacy Policy
            </a>{" "}
            for details.
          </p>
          <p>
            <strong className="text-foreground">Children.</strong> DevBench is
            not directed at children under 13. We do not knowingly collect
            personal information from children.
          </p>
          <p>
            <strong className="text-foreground">Changes.</strong> We may update
            this policy as the site evolves. The &ldquo;last updated&rdquo; date
            at the top reflects the most recent revision.
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
