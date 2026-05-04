import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
  json: { bg: "bg-amber-500/10", text: "text-amber-600", icon: "bg-amber-500/15" },
  converter: { bg: "bg-blue-500/10", text: "text-blue-600", icon: "bg-blue-500/15" },
  encoder: { bg: "bg-emerald-500/10", text: "text-emerald-600", icon: "bg-emerald-500/15" },
  generator: { bg: "bg-purple-500/10", text: "text-purple-600", icon: "bg-purple-500/15" },
  formatter: { bg: "bg-rose-500/10", text: "text-rose-600", icon: "bg-rose-500/15" },
  crypto: { bg: "bg-cyan-500/10", text: "text-cyan-600", icon: "bg-cyan-500/15" },
  text: { bg: "bg-orange-500/10", text: "text-orange-600", icon: "bg-orange-500/15" },
  web: { bg: "bg-indigo-500/10", text: "text-indigo-600", icon: "bg-indigo-500/15" },
};

const fallbackColor = { bg: "bg-accent/10", text: "text-accent", icon: "bg-accent/15" };

interface ToolCardProps {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: string;
  icon: LucideIcon;
}

export default function ToolCard({
  slug,
  name,
  shortName,
  description,
  category,
  icon: Icon,
}: ToolCardProps) {
  const colors = categoryColors[category] ?? fallbackColor;

  return (
    <Link
      href={`/tools/${slug}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.icon} transition-transform duration-200 group-hover:scale-110`}
        >
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
        >
          {category}
        </span>
      </div>

      <h3 className="mb-1 font-semibold text-card-foreground">
        <span className="md:hidden">{shortName}</span>
        <span className="hidden md:inline">{name}</span>
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {description}
      </p>
    </Link>
  );
}
