import Link from "next/link";
import { Card } from "@/components/ui/card";

/**
 * Spec §6.1 — label (text-sm, secondary) above, big mono number (text-2xl)
 * below.
 *
 * `value` is `null` when the figure is genuinely unknown, and renders an em
 * dash. A zero is only ever shown when the backend actually returned zero.
 */
export function StatCard({
  label,
  value,
  suffix,
  action,
}: {
  label: string;
  value: string | null;
  suffix?: string;
  action?: { href: string; label: string };
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-muted">{label}</p>

      <p className="font-mono text-2xl leading-none font-medium text-fg">
        {value ?? "—"}
        {value !== null && suffix ? (
          <span className="ml-2 font-sans text-sm font-normal text-muted">{suffix}</span>
        ) : null}
      </p>

      {action ? (
        <Link
          href={action.href}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {action.label}
        </Link>
      ) : null}
    </Card>
  );
}
