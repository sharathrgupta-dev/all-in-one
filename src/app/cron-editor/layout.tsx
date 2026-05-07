import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cron Editor — Schedule Expression Builder | DevBench",
  description:
    "Build and understand cron expressions with plain-English descriptions, next run times, and presets — crontab-style scheduler helper.",
  keywords: ["cron editor", "crontab", "cron expression", "schedule builder", "cron syntax", "cron job generator"],
  alternates: { canonical: "https://devbench.co.in/cron-editor" },
};

export default function CronEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
