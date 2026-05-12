"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, Menu, X } from "lucide-react";
import DevBenchMark from "@/components/DevBenchMark";

const NAV_LINKS = [
  { href: "/json",             label: "JSON"      },
  { href: "/yaml",             label: "YAML"      },
  { href: "/pdf",              label: "PDF"       },
  { href: "/api-tester",       label: "API"       },
  { href: "/jwt-debugger",     label: "JWT"       },
  { href: "/diff-checker",     label: "Diff"      },
  { href: "/code-beautify",    label: "Beautify"  },
  { href: "/epoch",            label: "Epoch"     },
  { href: "/linux-cheatsheet", label: "CLI"       },
  { href: "/date-calculator",  label: "Date +"    },
  { href: "/astronomy",        label: "Sun/Moon"  },
  { href: "/cron-editor",      label: "Cron"      },
  { href: "/graph-calculator", label: "Math"      },
  { href: "/blog",             label: "Blog"      },
  { href: "/contact",          label: "Contact"   },
];

export default function Header() {
  const [dark, setDark]         = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Inline script in layout already applied classes — sync icon state from DOM.
    setDark(document.documentElement.classList.contains("dark"));

    function onStorage(e: StorageEvent) {
      if (e.key !== "theme") return;
      const root = document.documentElement;
      const t = localStorage.getItem("theme");
      if (t === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        setDark(true);
      } else if (t === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
        setDark(false);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
        root.classList.remove("light");
        setDark(prefersDark);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !dark;
    setDark(next);
    if (next) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light"); // blocks OS dark-mode media query
    }
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
            type="button"
            onClick={() => window.dispatchEvent(new Event("devbench:open-palette"))}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <span>Search</span>
            <kbd aria-label="keyboard shortcut Command K" className="text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            suppressHydrationWarning
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
          >
            {dark ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            {menuOpen ? <X aria-hidden="true" className="h-4 w-4" /> : <Menu aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav id="mobile-nav" className="border-t border-border bg-background px-4 pb-3 pt-2 lg:hidden grid grid-cols-3 gap-1">
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
