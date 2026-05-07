import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Epoch Converter — Unix Timestamp & Date | DevBench",
  description:
    "Convert Unix timestamps to dates and back. Live clock, timezone-aware conversions, duration breakdown — client-side.",
  keywords: ["epoch converter", "unix timestamp", "timestamp to date", "unix time converter", "epoch time", "seconds to date"],
  alternates: { canonical: "https://devbench.co.in/epoch" },
};

export default function EpochLayout({ children }: { children: React.ReactNode }) {
  return children;
}
