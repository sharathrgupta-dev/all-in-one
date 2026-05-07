"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, Menu, X } from "lucide-react";
import DevBenchMark from "@/components/DevBenchMark";

const NAV_LINKS = [
  { href: "/json",            label: "JSON"      },
  { href: "/yaml",            label: "YAML"      },
  { href: "/api-tester",      label: "API"       },
  { href: "/jwt-debugger",    label: "JWT"       },
  { href: "/diff-checker",    label: "Diff"      },
  { href: "/code-beautify",   label: "Beautify"  },
  { href: "/epoch",           label: "Epoch"     },
  { href: "/cron-editor",     label: "Cron"      },
  { href: "/graph-calculator",label: "Math"      },
  { href: "/contact",         label: "Contact"   },
];

export default function Header() {
  const [dark, setDark]         = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && root.classList.contains("dark"))) {
      setDark(true);
      root.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !dark;
    setDark(next);
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-13 max-w-screen-2xl items-center gap-1 px-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-foreground hover:text-accent transition-colors mr-3"
        >
          <DevBenchMark className="h-6 w-6 shrink-0 text-accent" />
          <span className="text-base font-bold tracking-tight">DevBench</span>
        </Link>

        {/* Nav — all items visible on desktop */}
        <nav className="hidden items-center lg:flex flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => window.dispatchEvent(new Event("devbench:open-palette"))}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Open search"
          >
            <span>Search</span>
            <kbd className="text-[10px] font-mono opacity-60">⌘K</kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="border-t border-border bg-background px-4 pb-3 pt-2 lg:hidden grid grid-cols-3 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-center"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
