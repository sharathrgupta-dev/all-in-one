import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { normaliseHost, PLAYGROUND_HOST, PLAYGROUND_ORIGIN, SITE_URL } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = normaliseHost(h.get("x-forwarded-host") ?? h.get("host"));
  const canonical = host === PLAYGROUND_HOST ? `${PLAYGROUND_ORIGIN}/` : `${SITE_URL}/playground`;
  return {
    title: "Code playground — JavaScript, TypeScript, Python, notebooks",
    description:
      "Run JavaScript and TypeScript in a sandboxed iframe with console capture, Python via Pyodide (WASM), and execute code cells from .ipynb files — all in your browser.",
    alternates: { canonical },
  };
}

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return children;
}
