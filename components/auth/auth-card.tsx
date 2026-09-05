import { AlertCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/* Spec §4.1 — max-width 400px card on bg-primary, links to the sibling auth
   page below it. Auth failures surface as a banner at the top of the card. */

export function AuthCard({
  title,
  subtitle,
  error,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  error?: string | null;
  children: ReactNode;
  footer: { prompt: string; href: string; label: string };
}) {
  return (
    <div className="w-full max-w-100">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-6 md:p-8">
        <h1 className="font-display text-xl font-semibold text-fg">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}

        {/* Top-of-card error banner. Always live so it's announced on appearance. */}
        <div aria-live="assertive">
          {error ? (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-[var(--radius-control)] border border-danger/40 bg-danger-muted p-3"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
              <p className="text-sm text-fg">{error}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6">{children}</div>

        {/* Clerk bot sign-up protection mount point */}
        <div id="clerk-captcha" className="empty:hidden mt-4 flex justify-center" />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        {footer.prompt}{" "}
        <Link href={footer.href} className="font-medium text-accent hover:text-accent-hover">
          {footer.label}
        </Link>
      </p>
    </div>
  );
}
