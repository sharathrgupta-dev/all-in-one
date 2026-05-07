import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevents readable source code appearing in browser DevTools on production
  productionBrowserSourceMaps: false,

  // Gzip responses (Vercel edge already does this; ensures coverage elsewhere)
  compress: true,

  // @imgly/background-removal fetches its ONNX model files from CDN at runtime,
  // so no special bundler rules are needed — an empty turbopack block suppresses
  // the "webpack config present but no turbopack config" warning in Next.js 16.
  turbopack: {},

  async redirects() {
    return [
      // /tools/json-formatter → /json (the real JSON workspace)
      {
        source: "/tools/json-formatter",
        destination: "/json",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
