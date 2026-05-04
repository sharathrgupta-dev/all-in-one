import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Epoch Converter — Unix Timestamp & Date | DevForge",
  description:
    "Convert Unix timestamps to dates and back. Live clock, timezone-aware conversions, duration breakdown — client-side.",
  keywords: ["epoch converter", "unix timestamp", "timestamp to date"],
};

export default function EpochLayout({ children }: { children: React.ReactNode }) {
  return children;
}
