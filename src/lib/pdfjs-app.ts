"use client";

/**
 * Lazy-load pdf.js and point the worker at our static copy (same-origin, works with CSP).
 */
let workerConfigured = false;

export async function getPdfJsModule(): Promise<typeof import("pdfjs-dist")> {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdfjs/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}
