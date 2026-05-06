import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://devbench.co.in"),
  title: {
    default: "DevBench — Free Online Developer Tools",
    template: "%s | DevBench",
  },
  description:
    "100+ free browser-based developer tools. Format JSON, encode Base64, test regex, debug JWT, compare text, generate UUID, convert YAML, and more. No signup — everything runs in your browser.",
  keywords: [
    "developer tools online",
    "free developer tools",
    "JSON formatter online",
    "JSON validator",
    "Base64 encoder decoder",
    "regex tester online",
    "JWT debugger",
    "text diff checker",
    "UUID generator",
    "ULID generator",
    "YAML to JSON converter",
    "JSON to CSV",
    "URL encoder decoder",
    "SHA256 hash generator",
    "markdown preview",
    "cron expression parser",
    "Unix timestamp converter",
    "password generator",
    "color converter HEX RGB HSL",
    "HTML to JSX converter",
    "developer toolkit",
    "online coding tools",
    "devbench",
  ],
  authors: [{ name: "DevBench", url: "https://devbench.co.in" }],
  creator: "DevBench",
  publisher: "DevBench",
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
    url: "https://devbench.co.in",
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
    canonical: "https://devbench.co.in",
  },
  verification: {
    google: "IgIfgAzxEG7NcxiC8hTObe1nFIY-WNqIAjS2mBi0h8o",
  },
  other: {
    "google-adsense-account": "ca-pub-6450653669194686",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Preconnect hints — reduce DNS + TLS latency for third-party origins */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />

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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Google Tag Manager — noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NBTV4W35"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6450653669194686"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
    </html>
  );
}
