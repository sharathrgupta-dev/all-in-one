import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";

interface ToolLayoutProps {
  name: string;
  description: string;
  category: string;
  children: React.ReactNode;
}

export default function ToolLayout({
  name,
  description,
  category,
  children,
}: ToolLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <Link
          href="/tools"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all tools
        </Link>

        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {name}
            </h1>
            <p className="mt-1 text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <Globe className="h-3 w-3" />
              Runs in browser
            </span>
          </div>
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}
