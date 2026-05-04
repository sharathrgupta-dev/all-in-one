import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Math Suite — Graph, Scientific & Matrix Calculator | DevForge",
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
};

export default function GraphCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
