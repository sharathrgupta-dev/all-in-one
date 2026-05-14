import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TOOLS } from "@/lib/tools-registry";
import LazyCommandPalette from "@/components/LazyCommandPalette";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devbench.co.in"),
  title: {
    default: "DevBench — Free Online Developer Tools",
    template: "%s | DevBench",
  },
  description:
    "100+ free browser-based developer tools. Format JSON, encode Base64, test regex, debug JWT, compare text, generate UUID, convert YAML, and more. No signup — everything runs in your browser.",
  authors: [{ name: "DevBench", url: "https://www.devbench.co.in" }],
  creator: "DevBench",
  publisher: "DevBench",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DevBench",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.devbench.co.in",
    siteName: "DevBench",
    title: "DevBench — Free Online Developer Tools",
    description:
      "100+ free browser-based developer tools — JSON, Base64, Regex, JWT, Diff, UUID, YAML, CSV, and more. No signup, runs entirely in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevBench — Free Online Developer Tools",
    description:
      "100+ free browser-based developer tools — JSON, Base64, Regex, JWT, Diff, UUID, YAML, CSV. No signup required.",
    site: "@devbench",
    creator: "@devbench",
  },
  alternates: {
    canonical: "https://www.devbench.co.in",
  },
  verification: {
    google: "IgIfgAzxEG7NcxiC8hTObe1nFIY-WNqIAjS2mBi0h8o",
  },
  other: {
    "google-adsense-account": "ca-pub-6450653669194686",
    "impact-site-verification": "cc3bd3ed-9ab6-44e7-9814-e7d4d48e2416",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Plain script avoids next/script data-nscript mismatch warnings for AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6450653669194686"
          crossOrigin="anonymous"
        />
        {/* Sync theme on <html> before CSS/paint so Tailwind dark: matches preference (see globals.css @custom-variant) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme"),r=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"){r.classList.add("dark");r.classList.remove("light");}else if(t==="light"){r.classList.remove("dark");r.classList.add("light");}else{r.classList.toggle("dark",m);r.classList.remove("light");}}catch(e){}})();`,
          }}
        />
        {/* Preconnect hints — only origins this page actually requests */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fundingchoicesmessages.google.com" />
        {/* Inline critical above-the-fold styles to prevent render-blocking on LCP element */}
        <style dangerouslySetInnerHTML={{ __html: `body{background:#fafafa;color:#111111}html.dark body{background:#09090b;color:#fafafa}@media(prefers-color-scheme:dark){html:not(.light) body{background:#09090b;color:#fafafa}}` }} />
        {/* Google Tag Manager — head script */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NBTV4W35');`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Skip to content — visible only when focused; first-tab-stop for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to content
        </a>
        {/* Google Tag Manager — noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NBTV4W35"
            title="Google Tag Manager"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
          <div style={{ padding: "1rem", textAlign: "center", fontFamily: "system-ui" }}>
            DevBench tools require JavaScript to run in your browser. Please enable JS to use them.
          </div>
        </noscript>
        {children}
        <LazyCommandPalette tools={TOOLS} />
        <ServiceWorkerRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
