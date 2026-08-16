import { cn } from "@/lib/cn";

/**
 * Spec §1.4 — a single centered spinner is only acceptable for full-page loads
 * or button-level loading. Anything that renders a list or grid uses Skeleton.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 animate-spin", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full-page / full-panel load. */
export function PageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-60 place-items-center" role="status" aria-live="polite">
      <Spinner className="size-6 text-muted" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
