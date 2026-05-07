import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Math Suite — Graph, Scientific & Matrix Calculator | DevBench",
  description:
    "Free browser math workspace: 2D function plotting (zoom, pan, tables, intersections), scientific expression evaluation, and dynamic N×N matrix algebra (determinant, inverse, multiply). Client-side.",
  keywords: [
    "graphing calculator",
    "scientific calculator online",
    "matrix calculator",
    "plot function",
    "free graph calculator",
    "Desmos alternative",
  ],
  alternates: { canonical: "https://devbench.co.in/graph-calculator" },
};

export default function GraphCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <section className="max-w-5xl mx-auto px-4 pb-10 w-full border-t border-border pt-8 mt-2 space-y-3">
        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          Math Suite — graphing, scientific, and matrix calculator
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A three-in-one browser math workspace. The{" "}
          <strong>graphing calculator</strong> plots multiple functions
          simultaneously with zoom, pan, intersection detection, and value
          tables. The <strong>scientific calculator</strong> evaluates complex
          expressions including trigonometry, logarithms, and constants. The{" "}
          <strong>matrix calculator</strong> handles N×N matrices for
          determinant, inverse, transpose, and multiplication operations.
          Nothing is sent to a server — all computation runs in the browser.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">Supported functions</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground font-mono">
          <li>Trig: <span className="text-accent">sin, cos, tan, asin, acos, atan, atan2</span></li>
          <li>Hyperbolic: <span className="text-accent">sinh, cosh, tanh</span></li>
          <li>Exponential: <span className="text-accent">exp, log, log2, log10, sqrt, cbrt, pow</span></li>
          <li>Constants: <span className="text-accent">pi, e, phi (golden ratio)</span></li>
          <li>Rounding: <span className="text-accent">floor, ceil, round, abs, sign</span></li>
        </ul>

        <h2 className="text-base font-semibold text-foreground mt-6 mb-2">
          Graphing calculator tips
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Scroll to zoom in and out; drag the canvas to pan</li>
          <li>Hover over the graph to trace function values at any x</li>
          <li>Add multiple functions to find their intersections automatically</li>
          <li>Toggle a function&apos;s visibility without deleting it</li>
        </ul>
      </section>
      <Footer />
    </>
  );
}
