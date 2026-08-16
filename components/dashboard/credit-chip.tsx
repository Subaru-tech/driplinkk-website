import Link from "next/link";
import { formatCredits } from "@/lib/format";

/**
 * Spec §5 — credit balance chip in the top bar, clickable, jumps to Billing.
 *
 * When the balance is unknown (backend not connected, or no profile row yet)
 * it renders an em dash. It never falls back to "0" — that would be a made-up
 * number presented as live data.
 */
export function CreditChip({ balance }: { balance: number | null }) {
  return (
    <Link
      href="/dashboard/billing"
      className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 transition-colors hover:border-line-strong hover:bg-raised"
    >
      <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
      <span className="font-mono text-xs text-fg">
        {balance === null ? "—" : formatCredits(balance)}
      </span>
      <span className="text-xs text-muted">credits</span>
    </Link>
  );
}
