"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sun, Moon, Menu, X, ChevronDown } from "lucide-react";
import DevBenchMark from "@/components/DevBenchMark";

const PRIMARY_LINKS = [
  { href: "/json",          label: "JSON" },
  { href: "/yaml",          label: "YAML" },
  { href: "/api-tester",    label: "API Tester" },
  { href: "/jwt-debugger",  label: "JWT" },
  { href: "/diff-checker",  label: "Diff" },
  { href: "/code-beautify", label: "Code Beautify" },
];

const MORE_LINKS = [
  { href: "/epoch",            label: "Epoch Converter" },
  { href: "/cron-editor",      label: "Cron Editor" },
  { href: "/graph-calculator", label: "Math Suite" },
  { href: "/about",            label: "About" },
  { href: "/contact",          label: "Contact" },
];

const ALL_MOBILE_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS];

export default function Header() {
  const [dark, setDark]           = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [moreOpen, setMoreOpen]   = useState(false);
  const moreRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && root.classList.contains("dark"))) {
      setDark(true);
      root.classList.add("dark");
    }
  }, []);

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !dark;
    setDark(next);
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  const navLinkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-foreground transition-colors hover:text-accent mr-2"
        >
          <DevBenchMark className="h-7 w-7 shrink-0 text-accent" />
          <span className="text-lg font-bold tracking-tight">DevBench</span>
        </Link>

        {/* Primary nav — desktop */}
        <nav className="hidden items-center gap-0.5 md:flex flex-1">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`${navLinkClass} inline-flex items-center gap-1`}
              aria-expanded={moreOpen}
            >
              More
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 rounded-xl border border-border bg-card shadow-lg py-1 z-50">
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => window.dispatchEvent(new Event("devbench:open-palette"))}
            className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Open search"
          >
            <span>Search</span>
            <kbd className="flex items-center gap-0.5 text-[10px] font-mono opacity-60">
              <span>⌘</span><span>K</span>
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden grid grid-cols-2 gap-1">
          {ALL_MOBILE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
