import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools-registry";
import { BLOG_POSTS } from "@/lib/blog";
import { TOOL_COMPARISONS } from "@/lib/tool-comparisons";

const BASE = "https://www.devbench.co.in";

// Bump this when content (tools, comparisons, structure) changes.
// Using a stable date instead of `new Date()` so Google trusts lastmod —
// Search Console penalises sitemaps where lastmod ticks forward on every deploy.
const SITE_LASTMOD = new Date("2026-05-10");

const WORKSPACE_ROUTES = [
  { path: "/json",             priority: 0.9,  freq: "weekly"  },
  { path: "/yaml",             priority: 0.9,  freq: "weekly"  },
  { path: "/pdf",              priority: 0.85, freq: "monthly" },
  { path: "/jwt-debugger",     priority: 0.9,  freq: "monthly" },
  { path: "/api-tester",       priority: 0.9,  freq: "monthly" },
  { path: "/diff-checker",     priority: 0.9,  freq: "monthly" },
  { path: "/cron-editor",      priority: 0.8,  freq: "monthly" },
  { path: "/epoch",            priority: 0.8,  freq: "monthly" },
  { path: "/linux-cheatsheet", priority: 0.85, freq: "monthly" },
  { path: "/date-calculator",  priority: 0.85, freq: "monthly" },
  { path: "/astronomy",        priority: 0.85, freq: "monthly" },
  { path: "/code-beautify",    priority: 0.8,  freq: "monthly" },
  { path: "/graph-calculator", priority: 0.8,  freq: "monthly" },
  { path: "/blog",             priority: 0.8,  freq: "weekly"  },
  { path: "/compare",          priority: 0.65, freq: "monthly" },
  { path: "/about",            priority: 0.5,  freq: "yearly"  },
  { path: "/contact",          priority: 0.5,  freq: "yearly"  },
  { path: "/privacy",          priority: 0.4,  freq: "yearly"  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: SITE_LASTMOD,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...WORKSPACE_ROUTES.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: SITE_LASTMOD,
      changeFrequency: r.freq as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: r.priority,
    })),
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE}/tools/${tool.slug}`,
    lastModified: SITE_LASTMOD,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const compareRoutes: MetadataRoute.Sitemap = TOOL_COMPARISONS.map((c) => ({
    url: `${BASE}/compare/${c.slug}`,
    lastModified: SITE_LASTMOD,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...compareRoutes, ...toolRoutes, ...blogRoutes];
}
