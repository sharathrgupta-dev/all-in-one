import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Date Calculator — Add or Subtract Years, Months, Weeks, Days";
const description =
  "Add or subtract time from any date — calendar-safe months/years, weeks and days. See the resulting weekday instantly. Free, runs in your browser.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "date calculator",
    "add days to date",
    "date arithmetic",
    "calendar calculator",
    "subtract weeks from date",
  ],
  alternates: { canonical: `${SITE_URL}/date-calculator` },
  ...socialMetadata({ title, description, canonicalPath: "/date-calculator" }),
};

export default function DateCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-2 mb-2">How date math works here</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Years and months adjust on the <strong className="text-foreground">calendar</strong> (month lengths differ). Weeks and days are
          added after that as ordinary day counts. Results use your browser&apos;s local calendar for the selected date.
        </p>
      </section>
      <Footer />
    </>
  );
}
