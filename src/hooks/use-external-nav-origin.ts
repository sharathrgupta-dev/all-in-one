"use client";

import { useLayoutEffect, useState } from "react";
import { PLAYGROUND_HOST, SITE_URL } from "@/lib/site-config";

/**
 * When the UI is loaded on `playground.*`, main-site tool links should use `www`
 * so client-side navigation does not hit the playground host (middleware would
 * 308, which is unreliable for `next/link`).
 */
export function useExternalNavOrigin(): string {
  const [origin, setOrigin] = useState("");
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      if (typeof window === "undefined") return;
      if (window.location.hostname === PLAYGROUND_HOST) {
        setOrigin(SITE_URL);
      }
    });
  }, []);
  return origin;
}
