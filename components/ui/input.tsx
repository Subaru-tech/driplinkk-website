"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Spec §1.4 — Input
   bg-tertiary, 1px border, 8px radius, 40px height, 12px horizontal padding.
   Focus: border → accent + 2px accent glow ring.
   Error: border → danger, helper text below in danger.
   Spec §8: errors are announced via aria-live, not just painted red. */

const controlBase =
  "w-full rounded-[var(--radius-control)] border bg-raised px-3 text-sm text-fg " +
  /* Placeholders use text-muted, not text-faint: the field sits on the raised
     surface, and faint-on-raised is the one pairing in the ramp that misses
     WCAG AA. */
  "placeholder:text-muted transition-colors duration-150 " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/35 " +
  "disabled:cursor-not-allowed disabled:opacity-40";

function controlStyles(invalid?: boolean, className?: string) {
  return cn(
    controlBase,
    invalid ? "border-danger focus:border-danger focus:ring-danger/35" : "border-line-control",
    className,
  );
}

/* ------------------------------------------------------------------ Field */

type FieldProps = {
  label: string;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  /** Neutral hint shown when there is no error. */
  hint?: ReactNode;
  error?: string | null;
  /** Rendered at the right of the label row — e.g. "Forgot password?". */
  action?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

export function Field({
  label,
  hideLabel = false,
  hint,
  error,
  action,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const invalid = Boolean(error);
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className={cn("flex items-baseline justify-between gap-4", hideLabel && "sr-only")}>
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {action}
      </div>

      {children({ id, describedBy: hasMessage ? messageId : undefined, invalid })}

      {/* Always mounted so screen readers announce the error when it appears. */}
      <p
        id={messageId}
        role={error ? "alert" : undefined}
        aria-live="polite"
        className={cn(
          "text-xs",
          error ? "text-danger" : "text-muted",
          !hasMessage && "sr-only",
        )}
      >
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ Inputs */

type InputProps = ComponentProps<"input"> & { invalid?: boolean };

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlStyles(invalid, className), "h-10")}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlStyles(invalid, className), "min-h-32 py-2.5 leading-relaxed")}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlStyles(invalid, className), "h-10 cursor-pointer pr-8")}
    >
      {children}
    </select>
  );
}

/** Password input with a show/hide toggle — spec §4.1. */
export function PasswordInput({ invalid, className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn(controlStyles(invalid, className), "h-10 pr-11")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-fg"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Checkbox with an inline label — used for the signup terms gate (§4.1). */
export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        {...props}
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
      />
      <label htmlFor={id} className="cursor-pointer text-sm text-muted">
        {label}
      </label>
    </div>
  );
}
