import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cron Editor — Schedule Expression Builder | DevForge",
  description:
    "Build and understand cron expressions with plain-English descriptions, next run times, and presets — crontab-style scheduler helper.",
  keywords: ["cron editor", "crontab", "cron expression", "schedule builder"],
};

export default function CronEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
