import type { Metadata } from "next";
import { socialMetadata, SITE_URL } from "@/lib/social-metadata";

const title = "Epoch Converter — Unix Timestamp & Date";
const description =
  "Convert Unix timestamps to dates and back. Live clock, timezone-aware conversions, duration breakdown — client-side.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["epoch converter", "unix timestamp", "timestamp to date", "unix time converter", "epoch time", "seconds to date"],
  alternates: { canonical: `${SITE_URL}/epoch` },
  ...socialMetadata({ title, description, canonicalPath: "/epoch" }),
};

export default function EpochLayout({ children }: { children: React.ReactNode }) {
  return children;
}
