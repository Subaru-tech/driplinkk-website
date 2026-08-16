import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Spec §1.4 — Empty state.
 * Centered outline icon, one line of copy, at most one CTA.
 * Used for EVERY "no data yet" case — never leave a bare blank panel.
 */
export function EmptyState({
  icon: Icon,
  message,
  action,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
  /** `sm` for dashboard tiles, `lg` for full-page empties (spec §6.2). */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const scale = {
    sm: { pad: "py-8", icon: "size-6", text: "text-sm" },
    md: { pad: "py-12", icon: "size-8", text: "text-sm" },
    lg: { pad: "py-20", icon: "size-10", text: "text-base" },
  }[size];

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 text-center", scale.pad, className)}
    >
      <Icon className={cn(scale.icon, "text-faint")} strokeWidth={1.5} aria-hidden="true" />
      <p className={cn(scale.text, "text-muted")}>{message}</p>
      {action}
    </div>
  );
}
