"use client";

import dynamic from "next/dynamic";
import type { Tool } from "@/lib/tools-registry";

/** Palette is ⌘K-only — lazy-load so ~80 KB stays off the critical path. */
const CommandPalette = dynamic(() => import("@/components/CommandPalette"), {
  ssr: false,
});

export default function LazyCommandPalette({ tools }: { tools: Tool[] }) {
  return <CommandPalette tools={tools} />;
}
