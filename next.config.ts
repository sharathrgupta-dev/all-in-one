import type { NextConfig } from "next";

// CSP — written as an array for readability, joined into a single header value.
// Notes:
//   - 'unsafe-inline' on script-src is required for GTM's bootstrap snippet and
//     our inline JSON-LD <script>. Mitigated by the explicit allowlist below.
//   - 'wasm-unsafe-eval' lets @imgly/background-removal load its ONNX runtime.
//   - frame-ancestors 'none' blocks clickjacking site-wide.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.google https://*.gstatic.com https://*.doubleclick.net https://va.vercel-scripts.com https://*.vercel-insights.com https://fundingchoicesmessages.google.com",
  "style-src 'self' 'unsafe-inline' https://*.gstatic.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://*.gstatic.com",
  "connect-src 'self' https://*.google.com https://*.google https://*.googletagmanager.com https://*.doubleclick.net https://*.googlesyndication.com https://va.vercel-scripts.com https://*.vercel-insights.com https://fundingchoicesmessages.google.com https://api.producthunt.com",
  "frame-src 'self' https://www.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.google https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

// HSTS is duplicated in vercel.json as a safety net, but it MUST be set here
// too — the apex→www redirect (below in redirects()) runs inside Next.js and
// inherits headers() values. HSTS preload requires the apex response to carry
// `includeSubDomains; preload`.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Prevents readable source code appearing in browser DevTools on production
  productionBrowserSourceMaps: false,

  // Gzip responses (Vercel edge already does this; ensures coverage elsewhere)
  compress: true,

  // @imgly/background-removal fetches its ONNX model files from CDN at runtime,
  // so no special bundler rules are needed — an empty turbopack block suppresses
  // the "webpack config present but no turbopack config" warning in Next.js 16.
  turbopack: {},

  async headers() {
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
    ];
  },

  async redirects() {
    return [
      // Apex → www. Must be handled in Next.js (not Vercel's edge domain redirect)
      // so the 308 response carries the Strict-Transport-Security header from
      // headers() above. Required for HSTS preload eligibility on the apex.
      //
      // ⚠️ Pair this with a Vercel dashboard change: set devbench.co.in to
      //   "serve project" (not "redirect to www.devbench.co.in"). Otherwise this
      //   rule never fires because Vercel intercepts apex traffic first.
      {
        source: "/:path*",
        has: [{ type: "host", value: "devbench.co.in" }],
        destination: "https://www.devbench.co.in/:path*",
        permanent: true,
      },
      {
        source: "/tools/json-formatter",
        destination: "/json",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
