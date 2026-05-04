import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevForge — All-in-One Developer Toolkit",
  description:
    "100+ free browser-based tools for developers. JSON formatter, validator, diff, converters, encoders, and more. No signup, no uploads — everything runs client-side.",
  keywords: [
    "JSON formatter",
    "JSON validator",
    "developer tools",
    "JWT decoder",
    "diff checker",
    "graphing calculator",
    "converter",
    "encoder",
    "base64",
    "YAML",
    "CSV",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
