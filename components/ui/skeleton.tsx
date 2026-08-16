import { cn } from "@/lib/cn";

/**
 * Spec §1.4 — loading state.
 * Skeleton blocks match the shape of the real content. Never use a bare
 * spinner for anything that renders a list or a grid.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-skeleton rounded-[var(--radius-control)] bg-raised", className)}
    />
  );
}

/** Wrapper that announces a loading region to assistive tech. */
export function SkeletonGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
