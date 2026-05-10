"use client";

import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

type Props = {
  href: string;
  vendor: string;
  offer: string;
  placement: "homepage_sponsor_bar" | "footer";
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

export default function TrackedAffiliateLink({
  href,
  vendor,
  offer,
  placement,
  className,
  children,
  ariaLabel,
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      aria-label={ariaLabel}
      className={className}
      onClick={() => track("affiliate_click", { vendor, offer, placement })}
    >
      {children}
    </a>
  );
}
