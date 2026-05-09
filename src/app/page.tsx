import { Shield, Zap, Globe, Sparkles } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolSearch from "@/components/ToolSearch";
import JsonLd from "@/components/JsonLd";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DevBench",
  url: "https://devbench.co.in",
  description:
    `${TOOLS.length}+ free tools in your browser — JSON, PDFs, converters, calculators. No signup.`,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://devbench.co.in/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const HERO_FEATURES = [
  {
    icon: Shield,
    title: "Private on your device",
    desc: "Nothing is uploaded to our servers. What you paste stays in your browser.",
  },
  {
    icon: Zap,
    title: "Ready when you are",
    desc: "No account, no queue. Pick a tool and use it in one click.",
  },
  {
    icon: Globe,
    title: `${TOOLS.length}+ tools in one place`,
    desc: "From JSON and PDFs to money, health, and date helpers — free forever.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero — server-rendered for fast LCP */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-light),transparent_70%)] opacity-60" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-border bg-card text-sm text-muted-foreground">
              <Sparkles
                className="h-3.5 w-3.5 shrink-0 text-accent"
                strokeWidth={2}
                aria-hidden
              />
              <span className="leading-none">
                {TOOLS.length} free tools · no signup · runs in your browser
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
              Your Developer
              <br />
              <span className="text-accent">Workbench</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Whether you ship code, study, or just need to fix a file fast — format JSON, work with
              PDFs, tweak images, or run a calculator in one place. It all runs on{" "}
              <span className="text-foreground/90">your device</span>. Free, no install.
            </p>

            {/* Trust strip — one row from md (grid avoids awkward 2+1 wrapping) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {HERO_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-row md:flex-col md:items-center gap-3 md:gap-4 rounded-2xl border border-border/70 bg-card/50 px-4 py-5 text-left md:text-center shadow-sm shadow-black/[0.03]"
                >
                  <div className="shrink-0 rounded-xl bg-accent/10 p-2.5 md:p-3">
                    <f.icon className="h-5 w-5 text-accent md:h-6 md:w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1 md:flex-none">
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:mx-auto md:max-w-[18rem]">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-b border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="text-muted-foreground/70 uppercase tracking-wide font-medium text-[10px]">
              Sponsored
            </span>
            <a
              href="https://namecheap.pxf.io/c/7275861/3884366/5618?partnerpropertyid=8365175"
              target="_blank"
              rel="nofollow noopener noreferrer sponsored"
              className="hover:text-foreground transition-colors"
            >
              Shared Hosting from $1.58/mo ↗
            </a>
            <span className="opacity-30 hidden sm:inline">·</span>
            <a
              href="https://namecheap.pxf.io/c/7275861/3884368/5618?partnerpropertyid=8365175"
              target="_blank"
              rel="nofollow noopener noreferrer sponsored"
              className="hover:text-foreground transition-colors"
            >
              VPS Hosting from $6.88/mo ↗
            </a>
            <span className="opacity-30 hidden sm:inline">·</span>
            <a
              href="https://namecheap.pxf.io/c/7275861/3884352/5618?partnerpropertyid=8365175"
              target="_blank"
              rel="nofollow noopener noreferrer sponsored"
              className="hover:text-foreground transition-colors"
            >
              Domains, SSLs & Premium DNS — Discounts Sitewide ↗
            </a>
          </div>
        </div>

        {/* Interactive search + tool grid — client component, tools passed as prop to keep registry out of client bundle */}
        <ToolSearch tools={TOOLS} />
      </main>
      <Footer />

      <JsonLd data={websiteSchema} />
    </>
  );
}
