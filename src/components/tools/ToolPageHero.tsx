import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import type { Tool } from "@/lib/tools-registry";
import { CATEGORIES } from "@/lib/tools-registry";

export default function ToolPageHero({ tool }: { tool: Tool }) {
  const category = CATEGORIES[tool.category];
  return (
    <div className="mb-6 animate-fade-in">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All Tools
      </Link>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold font-mono ${category.color}`}
        >
          {tool.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{tool.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${category.color}`}
            >
              {category.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Runs in browser
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-prose">
            {tool.description}
          </p>
        </div>
      </div>
    </div>
  );
}
