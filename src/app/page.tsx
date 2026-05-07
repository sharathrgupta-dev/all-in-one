import { Shield, Zap, Globe } from "lucide-react";
import { TOOLS } from "@/lib/tools-registry";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolSearch from "@/components/ToolSearch";

const HERO_FEATURES = [
  {
    icon: Shield,
    title: "100% Client-Side",
    desc: "No server uploads. Your data never leaves your browser.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    desc: "Zero friction. No signup, no waiting, no limits.",
  },
  {
    icon: Globe,
    title: `${TOOLS.length}+ Tools`,
    desc: "Developer utilities plus finance, health, math, and date calculators.",
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
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-border bg-card text-sm text-muted-foreground">
              <span className="w-3.5 h-3.5 text-accent">✦</span>
              <span>{TOOLS.length} free tools — no signup required</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
              Your Developer
              <br />
              <span className="text-accent">Workbench</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Format JSON, encode Base64, test regex, debug JWT, diff text, generate UUIDs — all in
              your browser. Fast, private, and completely free.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
              {HERO_FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3 text-left">
                  <div className="mt-0.5 p-2 rounded-lg bg-accent/10">
                    <f.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive search + tool grid — client component, tools passed as prop to keep registry out of client bundle */}
        <ToolSearch tools={TOOLS} />
      </main>
      <Footer />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://devbench.co.in/#website",
                url: "https://devbench.co.in",
                name: "DevBench",
                description:
                  "100+ free browser-based developer tools — JSON, Base64, Regex, JWT, Diff, UUID, and more.",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://devbench.co.in/?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": "https://devbench.co.in/#organization",
                name: "DevBench",
                url: "https://devbench.co.in",
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  url: "https://devbench.co.in/contact",
                },
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
