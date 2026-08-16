import { cn } from "@/lib/cn";

/**
 * Placeholder wordmark — a droplet fused to a link, in the accent green.
 * Swap for the real DripLink logo asset when brand delivers it.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" className="size-6 text-accent" aria-hidden="true" fill="none">
        <path
          d="M12 3.5c3.2 3.6 5.2 6.3 5.2 8.8a5.2 5.2 0 1 1-10.4 0c0-2.5 2-5.2 5.2-8.8Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.8 12.3h4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-display text-base font-semibold tracking-tight text-fg">
        DripLink
      </span>
    </span>
  );
}
