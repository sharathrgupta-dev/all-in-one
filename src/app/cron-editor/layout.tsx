import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Cron Editor — Schedule Expression Builder";
const description =
  "Build and understand cron expressions with plain-English descriptions, next run times, and presets — crontab-style scheduler helper.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["cron editor", "crontab", "cron expression", "schedule builder", "cron syntax", "cron job generator"],
  alternates: { canonical: `${SITE_URL}/cron-editor` },
  ...socialMetadata({ title, description, canonicalPath: "/cron-editor" }),
};

export default function CronEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
