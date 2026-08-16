import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/components/ui/spinner";

/* Spec §1.4 — Button
   Variants: primary | secondary | ghost | danger
   Sizes:    sm (32px) | md (40px) | lg (48px)
   States:   default, hover (lighter), active (darker), disabled (40% opacity,
             no pointer events), loading (spinner replaces the label and the
             button KEEPS ITS WIDTH — never resize on loading). */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium " +
  "whitespace-nowrap transition-colors duration-150 select-none " +
  "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-contrast hover:bg-accent-hover active:brightness-90",
  /* border-line-control, not border-line: a control's boundary needs 3:1
     (WCAG 1.4.11) and the decorative border token doesn't reach it. */
  secondary:
    "border border-line-control bg-transparent text-fg hover:bg-raised active:brightness-90",
  ghost: "bg-transparent text-muted hover:bg-raised hover:text-fg active:brightness-90",
  danger: "bg-danger text-white hover:brightness-110 active:brightness-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = Omit<ComponentProps<"button">, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
    >
      {/* The label stays in the flow but hidden while loading, so the button's
          width is identical in both states. */}
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {children}
      </span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner className="size-4" />
          <span className="sr-only">Loading</span>
        </span>
      ) : null}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Same visual language as Button, for real navigations. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link {...props} className={buttonStyles({ variant, size, className })} />;
}
