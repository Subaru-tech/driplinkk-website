import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Spec §1.4 — Card
   bg-secondary, 1px border, 12px radius, 24px padding (16px on mobile).
   The hover state is opt-in and only belongs on clickable cards. */

type CardProps = ComponentProps<"div"> & {
  as?: ElementType;
  /** Only for cards that are actually clickable. */
  interactive?: boolean;
  children: ReactNode;
};

export function Card({
  as: Tag = "div",
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      {...props}
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface p-4 md:p-6",
        interactive &&
          "transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/20",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ className, children, ...props }: ComponentProps<"h3">) {
  return (
    <h3 {...props} className={cn("font-display text-lg font-medium text-fg", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: ComponentProps<"p">) {
  return (
    <p {...props} className={cn("text-sm text-muted", className)}>
      {children}
    </p>
  );
}
