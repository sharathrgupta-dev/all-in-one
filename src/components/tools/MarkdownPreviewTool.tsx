"use client";

import { useMemo, useState } from "react";
import { Eye, Code2, ArrowLeftRight } from "lucide-react";
import ToolPageHero from "@/components/tools/ToolPageHero";
import type { Tool } from "@/lib/tools-registry";
import * as engines from "@/lib/tool-engines";

const DEFAULT_MARKDOWN = `# Markdown Preview

Write **Markdown** on the left — see the rendered output on the right, live.

## Formatting

- **Bold**, *italic*, ~~strikethrough~~
- \`inline code\`, [links](https://example.com)
- > Blockquotes

## Code blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Tables

| Feature      | Supported |
|--------------|-----------|
| GFM tables   | ✅        |
| Task lists   | ✅        |
| Fenced code  | ✅        |

## Task list

- [x] Write Markdown
- [x] See live preview
- [ ] Ship something great
`;

type View = "split" | "edit" | "preview";

export default function MarkdownPreviewTool({ tool }: { tool: Tool }) {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [view, setView] = useState<View>("split");

  const rendered = useMemo(() => {
    const result = engines.markdownToHtml(markdown);
    return typeof result === "string" ? result : result.output;
  }, [markdown]);

  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lines = markdown ? markdown.split("\n").length : 0;

  return (
    <div className="min-h-screen bg-background">
      <ToolPageHero tool={tool} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
            {(["split", "edit", "preview"] as View[]).map((v) => {
              const icons: Record<View, React.ElementType> = {
                split: ArrowLeftRight,
                edit: Code2,
                preview: Eye,
              };
              const Icon = icons[v];
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 capitalize transition-colors ${
                    view === v
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {v}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-muted-foreground ml-auto">
            {words} words · {lines} lines · {markdown.length} chars
          </span>
        </div>

        {/* Panels */}
        <div
          className={`grid gap-4 h-[660px] ${
            view === "split" ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {(view === "split" || view === "edit") && (
            <div className="flex flex-col rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
                <Code2 className="w-3.5 h-3.5" />
                Markdown
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="flex-1 p-4 font-mono text-sm bg-background resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {(view === "split" || view === "preview") && (
            <div className="flex flex-col rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50 text-xs font-medium text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </div>
              <div
                className="flex-1 p-6 overflow-auto prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
