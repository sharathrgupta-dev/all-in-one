import { track } from "@vercel/analytics";

// Vercel Analytics constrains property values to primitives. Keep the surface
// narrow so we don't accidentally try to send objects or arrays.
type EventProps = Record<string, string | number | boolean | null>;

/**
 * Wrap track() in try/catch — analytics failures must never break the user's
 * interaction with the tool. If the script is blocked or the SDK isn't loaded
 * yet, we silently swallow the error.
 */
function safeTrack(event: string, props?: EventProps): void {
  try {
    track(event, props);
  } catch {
    /* analytics failures are not user-facing */
  }
}

/** Truncate long error messages so we don't blow past Vercel's prop size limits. */
function shortMessage(msg?: string): string | null {
  if (!msg) return null;
  const trimmed = msg.trim();
  if (!trimmed) return null;
  return trimmed.length > 100 ? trimmed.slice(0, 97) + "…" : trimmed;
}

/** Fires when a user lands on any tool page. Use for: traffic per tool. */
export function trackToolVisit(slug: string): void {
  safeTrack("tool_visit", { slug });
}

/**
 * Fires when a tool successfully processes user input.
 * Use action="format" / "convert" / "encode" / "decode" / "send" / etc. — keep
 * actions discrete so they aggregate nicely in the dashboard.
 */
export function trackToolSuccess(
  tool: string,
  action: string,
  extra?: EventProps,
): void {
  safeTrack("tool_action_success", { tool, action, ...(extra ?? {}) });
}

/** Fires when processing throws / fails validation. message is truncated. */
export function trackToolError(
  tool: string,
  action: string,
  message?: string,
): void {
  const m = shortMessage(message);
  safeTrack("tool_action_error", {
    tool,
    action,
    ...(m ? { message: m } : {}),
  });
}

/** Fires when user copies a tool's output. `what` lets you distinguish copies (e.g. "json" vs "yaml" output on the JSON workspace). */
export function trackToolCopy(tool: string, what?: string): void {
  safeTrack("tool_copy_output", { tool, ...(what ? { what } : {}) });
}

/** Fires when user downloads a generated file (PDF, image, etc.). */
export function trackToolDownload(tool: string, format: string): void {
  safeTrack("tool_download", { tool, format });
}

/** Fires when user generates / copies a share link. */
export function trackToolShareLink(tool: string): void {
  safeTrack("tool_share_link", { tool });
}
