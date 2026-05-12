"use client";

import { useEffect } from "react";
import { trackToolVisit } from "@/lib/analytics-events";

const RECENT_KEY = "devbench:recent";
const MAX_RECENT = 8;

export default function TrackToolVisit({ slug }: { slug: string }) {
  useEffect(() => {
    // Save to localStorage for the "Recently used" homepage section
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const prev: string[] = raw ? JSON.parse(raw) : [];
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
    // Fire Vercel Analytics event
    trackToolVisit(slug);
  }, [slug]);
  return null;
}
