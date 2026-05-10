import Link from "next/link";
import { Shield, ExternalLink } from "lucide-react";
import DevBenchMark from "@/components/DevBenchMark";
import TrackedAffiliateLink from "@/components/TrackedAffiliateLink";

const AFFILIATE_LINKS = [
  {
    label: "Shared Hosting",
    href: "https://namecheap.pxf.io/c/7275861/3884366/5618?partnerpropertyid=8365175",
    desc: "from $1.58/mo",
    offer: "shared_hosting",
  },
  {
    label: "VPS Hosting",
    href: "https://namecheap.pxf.io/c/7275861/3884368/5618?partnerpropertyid=8365175",
    desc: "from $6.88/mo",
    offer: "vps_hosting",
  },
  {
    label: "Domains, SSLs & DNS",
    href: "https://namecheap.pxf.io/c/7275861/3884352/5618?partnerpropertyid=8365175",
    desc: "discounts sitewide",
    offer: "domains_ssl_dns",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2.5 text-center sm:text-left">
            Recommended hosting
          </p>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {AFFILIATE_LINKS.map((link) => (
              <TrackedAffiliateLink
                key={link.href}
                href={link.href}
                vendor="namecheap"
                offer={link.offer}
                placement="footer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span className="font-medium">{link.label}</span>
                <span className="opacity-70">{link.desc}</span>
                <ExternalLink aria-hidden="true" className="h-3 w-3 opacity-50" />
              </TrackedAffiliateLink>
            ))}
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:flex-wrap sm:gap-8">
            <a
              href="https://www.producthunt.com/products/devbench-2/reviews/new?utm_source=badge-product_review&utm_medium=badge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Leave DevBench a review on Product Hunt"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1220022&theme=dark"
                alt="Leave DevBench a review on Product Hunt"
                width={250}
                height={54}
                loading="lazy"
                decoding="async"
                className="h-[54px] w-[250px]"
              />
            </a>
            <a
              href="https://www.producthunt.com/products/devbench-2?utm_source=badge-follow&utm_medium=badge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg ring-offset-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Follow DevBench on Product Hunt"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/follow.svg?product_id=1220022&theme=neutral"
                alt="Follow DevBench on Product Hunt"
                width={250}
                height={54}
                loading="lazy"
                decoding="async"
                className="h-[54px] w-[250px]"
              />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <DevBenchMark aria-hidden="true" className="h-6 w-6 text-accent" />
              <span className="font-bold tracking-tight">DevBench</span>
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              No login required — your work stays in your browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-end">
            <Link
              href="/blog"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DevBench. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
