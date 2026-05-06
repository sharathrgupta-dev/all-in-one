import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug, getToolsByCategory, CATEGORIES } from "@/lib/tools-registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "Tool | DevBench" };
  }
  const title = `${tool.name} — Free Online Tool | DevBench`;
  const description =
    tool.description +
    " Runs entirely in your browser — no signup, no uploads, client-side only.";
  return {
    title,
    description,
    keywords: [tool.shortName, tool.name, "online tool", "free developer tools", "devbench"],
    openGraph: {
      title,
      description,
      url: `https://devbench.co.in/tools/${tool.slug}`,
      siteName: "DevBench",
    },
    alternates: { canonical: `https://devbench.co.in/tools/${tool.slug}` },
  };
}

export default async function ToolSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  const jsonLd = tool
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebApplication",
            "@id": `https://devbench.co.in/tools/${slug}/#webapp`,
            name: tool.name,
            url: `https://devbench.co.in/tools/${slug}`,
            description:
              tool.description +
              " Runs entirely in your browser — no signup, no uploads.",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires a modern web browser with JavaScript enabled.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            provider: {
              "@type": "Organization",
              name: "DevBench",
              url: "https://devbench.co.in",
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://devbench.co.in",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: tool.name,
                item: `https://devbench.co.in/tools/${slug}`,
              },
            ],
          },
        ],
      }
    : null;

  const relatedTools = tool
    ? getToolsByCategory(tool.category)
        .filter((t) => t.slug !== slug)
        .slice(0, 6)
    : [];
  const categoryMeta = tool ? CATEGORIES[tool.category] : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {children}
      {relatedTools.length > 0 && categoryMeta && (
        <aside className="max-w-6xl mx-auto px-4 pb-10 w-full">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            More {categoryMeta.label} tools
          </h2>
          <ul className="flex flex-wrap gap-2">
            {relatedTools.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-mono text-xs opacity-70">{t.icon}</span>
                  {t.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
