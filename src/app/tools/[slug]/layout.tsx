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
    return { title: "Tool | DevForge" };
  }
  const title = `${tool.name} — Free Online Tool | DevForge`;
  const description =
    tool.description +
    " Runs in your browser — no signup, client-side processing.";
  return {
    title,
    description,
    keywords: [tool.shortName, tool.name, "online tool", "developer tools"],
  };
}

export default function ToolSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
