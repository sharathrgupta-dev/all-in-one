import type { Metadata } from "next";
import Link from "next/link";
import { getToolBySlug, getToolsByCategory, CATEGORIES } from "@/lib/tools-registry";
import { TOOL_FAQS } from "@/lib/tool-faqs";
import { TOOL_PAGE_CONTENT } from "@/lib/tool-page-content";
import ToolSeoContent from "@/components/tools/ToolSeoContent";
import ToolFaqSection from "@/components/tools/ToolFaqSection";
import TrackToolVisit from "@/components/TrackToolVisit";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    return { title: "Tool" };
  }
  const extra = TOOL_PAGE_CONTENT[slug];
  const title = extra?.title ?? `${tool.name} — Free Online Tool`;
  const description = extra?.metaDescription ??
    `${tool.description} Runs entirely in your browser — no signup, no uploads, client-side only.`;
  const canonicalPath = `/tools/${tool.slug}`;
  const ogImageUrl = `${SITE_URL}/tools/${tool.slug}/opengraph-image`;
  return {
    title,
    description,
    keywords: [tool.shortName, tool.name, "online tool", "free developer tools", "devbench"],
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
    ...socialMetadata({
      title,
      description,
      canonicalPath,
      ogImageUrl,
      ogImageAlt: `${title} | DevBench`,
    }),
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
  const faqs = TOOL_FAQS[slug] ?? [];
  const extra = tool ? TOOL_PAGE_CONTENT[slug] : undefined;

  const graph: object[] = [];

  if (tool) {
    const appDescription =
      extra?.metaDescription ??
      `${tool.description} Runs entirely in your browser — no signup, no uploads.`;
    graph.push(
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/tools/${slug}/#webapp`,
        name: tool.name,
        url: `${SITE_URL}/tools/${slug}`,
        description: appDescription,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        provider: {
          "@type": "Organization",
          name: "DevBench",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: tool.name, item: `${SITE_URL}/tools/${slug}` },
        ],
      }
    );
  }

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  const jsonLd = graph.length > 0
    ? { "@context": "https://schema.org", "@graph": graph }
    : null;

  const relatedTools = tool
    ? getToolsByCategory(tool.category)
        .filter((t) => t.slug !== slug)
        .slice(0, 6)
    : [];
  const categoryMeta = tool ? CATEGORIES[tool.category] : null;

  return (
    <>
      <TrackToolVisit slug={slug} />
      {jsonLd && <JsonLd data={jsonLd} />}
      {children}
      <ToolSeoContent slug={slug} />
      <ToolFaqSection slug={slug} />
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
      <Footer />
    </>
  );
}
