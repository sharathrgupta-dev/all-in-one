import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Sun & Moon — Sunrise, Sunset, Moon Phase";
const description =
  "Sunrise, sunset, solar noon, moon illumination and moonrise/moonset for any date and location. Uses astronomical formulas in your browser — no external API.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "sunrise sunset calculator",
    "moon phase today",
    "moonrise moonset",
    "golden hour",
    "astronomy calculator",
  ],
  alternates: { canonical: `${SITE_URL}/astronomy` },
  ...socialMetadata({ title, description, canonicalPath: "/astronomy" }),
};

export default function AstronomyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-2 mb-2">Accuracy note</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Times use standard astronomical algorithms (SunCalc). Actual sunrise depends on terrain and altitude — results assume a flat
          horizon. Polar regions may show &quot;always up&quot; or &quot;always down&quot; for the Moon when paths never cross the horizon.
        </p>
      </section>
      <Footer />
    </>
  );
}
