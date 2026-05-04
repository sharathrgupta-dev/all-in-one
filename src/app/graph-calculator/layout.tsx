import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Math Suite — Graph, Scientific & Matrix Calculator | DevForge",
  description:
    "Free browser math workspace: 2D function plotting (zoom, pan, tables, intersections), scientific expression evaluation, and 2×2 / 3×3 matrix algebra. Client-side — Geometry and 3D graphing are not included (see Desmos for those).",
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
