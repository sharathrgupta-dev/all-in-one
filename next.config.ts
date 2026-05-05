import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @imgly/background-removal fetches its ONNX model files from CDN at runtime,
  // so no special bundler rules are needed — an empty turbopack block suppresses
  // the "webpack config present but no turbopack config" warning in Next.js 16.
  turbopack: {},
};

export default nextConfig;
