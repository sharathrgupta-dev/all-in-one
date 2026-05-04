import Link from "next/link";
import { Code2, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link href="/" className="flex items-center gap-2 text-foreground">
              <Code2 className="h-5 w-5 text-accent" />
              <span className="font-bold tracking-tight">DevForge</span>
            </Link>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              All tools run client-side. No data leaves your browser.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 DevForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
