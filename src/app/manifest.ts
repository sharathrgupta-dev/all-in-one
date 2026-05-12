import type { MetadataRoute } from "next";

/**
 * PWA manifest — served at /manifest.webmanifest.
 *
 * Drives "Add to Home Screen" UX on mobile, plus app-like display on Chrome
 * desktop. Icons reference the existing `src/app/icon.svg` (Next.js auto-serves
 * it at `/icon.svg`). SVG icons work in Chrome 99+ and Edge; older browsers
 * fall back to the favicon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DevBench — Free Online Developer Tools",
    short_name: "DevBench",
    description:
      "100+ free browser-based developer tools — JSON, Base64, Regex, JWT, Diff, UUID, YAML, CSV, and more. No signup, runs entirely in your browser.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    theme_color: "#4f46e5",
    background_color: "#fafafa",
    lang: "en",
    dir: "ltr",
    categories: ["productivity", "utilities", "developer"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    // Highlight the most-used tools as app shortcuts (long-press on icon → menu).
    // Each shortcut deep-links straight into a workspace.
    shortcuts: [
      {
        name: "JSON Toolkit",
        short_name: "JSON",
        description: "Format, validate, and convert JSON",
        url: "/json",
      },
      {
        name: "JWT Debugger",
        short_name: "JWT",
        description: "Decode and verify JSON Web Tokens",
        url: "/jwt-debugger",
      },
      {
        name: "API Tester",
        short_name: "API",
        description: "Send HTTP requests and inspect responses",
        url: "/api-tester",
      },
      {
        name: "Diff Checker",
        short_name: "Diff",
        description: "Compare two pieces of text side by side",
        url: "/diff-checker",
      },
    ],
  };
}
