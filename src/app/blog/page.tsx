import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BLOG_POSTS } from "@/lib/blog";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const BLOG_TITLE = "DevBench Blog — Developer Guides & Tutorials";
const BLOG_DESC =
  "In-depth guides for developers: JWT, UUID, regex, JSON, URL encoding, and more. Written by the team behind DevBench's free browser-based developer tools.";

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESC,
  keywords:
    "developer guides, jwt tutorial, base64 explained, regex cheat sheet, json syntax errors, uuid vs ulid, url encoding javascript, web development tips, devbench blog",
  alternates: { canonical: `${SITE_URL}/blog` },
  ...socialMetadata({
    title: BLOG_TITLE,
    description: BLOG_DESC,
    canonicalPath: "/blog",
  }),
};

const TAG_COLORS: Record<string, string> = {
  identifiers: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  databases:   "bg-green-500/10 text-green-600 dark:text-green-400",
  javascript:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  auth:        "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  security:    "bg-red-500/10 text-red-600 dark:text-red-400",
  jwt:         "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  web:         "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  urls:        "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  json:        "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  debugging:   "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  regex:       "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  reference:   "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  encoding:    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  yaml:        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  config:      "bg-stone-500/10 text-stone-600 dark:text-stone-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const sorted = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const [featured, ...rest] = sorted;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/20">
          <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              DevBench Blog
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
              Practical guides on the tools every developer uses daily — written to be bookmarked, not just skimmed.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14 space-y-12">
          {/* Featured post */}
          {featured && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Latest
              </p>
              <Link
                href={`/blog/${featured.slug}`}
                className="group block rounded-2xl border border-border bg-card p-6 sm:p-8 hover:border-accent/50 hover:shadow-sm transition-all"
              >
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {featured.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground"}`}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-accent transition-colors mb-3 leading-snug">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>{formatDate(featured.date)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {featured.readMinutes} min read
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-accent font-medium group-hover:gap-2 transition-all">
                    Read article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Rest of posts */}
          {rest.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                More articles
              </p>
              <div className="flex flex-col gap-4">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-xl border border-border bg-card px-5 py-4 hover:border-accent/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors leading-snug mb-1">
                        {post.title}
                      </h2>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0 text-xs text-muted-foreground">
                      <span className="whitespace-nowrap">{formatDate(post.date)}</span>
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {post.readMinutes} min
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": "https://www.devbench.co.in/blog",
            url: "https://www.devbench.co.in/blog",
            name: "DevBench Blog",
            description: "Developer guides on JWT, UUID, regex, JSON, URL encoding, and more.",
            publisher: {
              "@type": "Organization",
              name: "DevBench",
              url: "https://www.devbench.co.in",
            },
            blogPost: BLOG_POSTS.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `https://www.devbench.co.in/blog/${p.slug}`,
              datePublished: p.date,
              description: p.excerpt,
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />

      <Footer />
    </>
  );
}
