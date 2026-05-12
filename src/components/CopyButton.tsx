"use client";

import { useState, useCallback } from "react";
import { Clipboard, Check } from "lucide-react";
import { trackToolCopy } from "@/lib/analytics-events";

interface CopyButtonProps {
  text: string;
  className?: string;
  disabled?: boolean;
  /** Tool slug for analytics. Optional — when omitted, no event is fired. */
  toolSlug?: string;
  /** Optional label distinguishing this copy from others on the same tool. */
  copyLabel?: string;
}

export default function CopyButton({
  text,
  className = "",
  disabled = false,
  toolSlug,
  copyLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    if (toolSlug) trackToolCopy(toolSlug, copyLabel);
  }, [text, toolSlug, copyLabel]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || !text}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors ${
        copied
          ? "border-success/40 bg-success/10 text-success"
          : disabled || !text
            ? "cursor-not-allowed opacity-40"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Clipboard className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}
