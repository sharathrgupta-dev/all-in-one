/**
 * DevBench wordmark icon — code brackets `< />` resting on a workbench.
 * Inherits currentColor; use with text-accent or text-foreground.
 */
export default function DevBenchMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Left < bracket */}
      <path
        d="M7 3.5 L4 6.5 L7 9.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* / slash */}
      <line
        x1="12.25"
        y1="3"
        x2="10.75"
        y2="10"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Right > bracket */}
      <path
        d="M14.5 3.5 L17.5 6.5 L14.5 9.5"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bench surface */}
      <rect
        x="2"
        y="12"
        width="20"
        height="2.5"
        rx="1.25"
        fill="currentColor"
      />
      {/* Left leg */}
      <rect
        x="4.5"
        y="14.5"
        width="2"
        height="6.5"
        rx="1"
        fill="currentColor"
        opacity={0.75}
      />
      {/* Right leg */}
      <rect
        x="17.5"
        y="14.5"
        width="2"
        height="6.5"
        rx="1"
        fill="currentColor"
        opacity={0.75}
      />
    </svg>
  );
}
