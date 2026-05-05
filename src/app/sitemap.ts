import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools-registry";

const BASE = "https://devbench.co.in";

const WORKSPACE_ROUTES = [
  { path: "/json",             priority: 0.9, freq: "weekly"  },
  { path: "/jwt-debugger",     priority: 0.9, freq: "monthly" },
  { path: "/api-tester",       priority: 0.9, freq: "monthly" },
  { path: "/diff-checker",     priority: 0.9, freq: "monthly" },
  { path: "/cron-editor",      priority: 0.8, freq: "monthly" },
  { path: "/epoch",            priority: 0.8, freq: "monthly" },
  { path: "/code-beautify",    priority: 0.8, freq: "monthly" },
  { path: "/graph-calculator", priority: 0.8, freq: "monthly" },
  { path: "/about",            priority: 0.5, freq: "yearly"  },
  { path: "/contact",          priority: 0.5, freq: "yearly"  },
  { path: "/privacy",          priority: 0.4, freq: "yearly"  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...WORKSPACE_ROUTES.map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq as MetadataRoute.Sitemap[number]["changeFrequency"],
      priority: r.priority,
    })),
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((tool) => ({
    url: `${BASE}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
