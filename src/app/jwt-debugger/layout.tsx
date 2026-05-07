import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JWT Debugger — Decode, Encode & Verify Tokens | DevBench",
  description:
    "Free online JWT decoder and encoder. Inspect headers and payloads, verify HMAC signatures (HS256/384/512), see claim breakdown and expiry — runs entirely in your browser.",
  keywords: [
    "JWT decoder",
    "JWT encoder",
    "JSON Web Token",
    "verify JWT",
    "jwt.io alternative",
    "decode JWT online",
  ],
  alternates: { canonical: "https://devbench.co.in/jwt-debugger" },
};

export default function JwtDebuggerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
