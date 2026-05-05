import type { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools-registry";

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

export default function ToolSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
