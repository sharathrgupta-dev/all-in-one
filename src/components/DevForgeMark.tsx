/**
 * DevForge wordmark icon — anvil + forging sparks + faint `{` `}` hints (toolkit / code).
 * Use with text-accent or text-foreground; inherits currentColor.
 */
export default function DevForgeMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* forging sparks */}
      <circle cx="17.8" cy="5.2" r="1.15" fill="currentColor" opacity={0.92} />
      <circle cx="19.9" cy="7.9" r="0.95" fill="currentColor" opacity={0.85} />
      <circle cx="17.1" cy="9.1" r="0.8" fill="currentColor" opacity={0.78} />
      {/* anvil */}
      <path
        fill="currentColor"
        d="M6 18.75h12v2.25H6v-2.25Zm1.1-2h9.8v1.35H7.1v-1.35Zm.9-5.2h8l-.65-4.35h-6.7L8 11.55Zm1.05-6.1h5.9l-.5-2.55h-4.9l-.5 2.55Z"
      />
      {/* subtle developer-toolkit bracket cues */}
      <path
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.32}
        d="M3.25 11.25c-.85 0-1.35.55-1.35 1.55v2.4c0 1 .5 1.55 1.35 1.55"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.32}
        d="M20.75 11.25c.85 0 1.35.55 1.35 1.55v2.4c0 1-.5 1.55-1.35 1.55"
      />
    </svg>
  );
}
