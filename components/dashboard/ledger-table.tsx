import Link from "next/link";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatSignedCredits } from "@/lib/format";
import type { LedgerEntry, LedgerEntryType } from "@/lib/types";
import { cn } from "@/lib/cn";

/* Spec §6.4 — Date, Type, Amount, Balance after.
   Type is a small colored tag, deliberately NOT a full status pill.
   Amount is mono and green for additions, default text for deductions.
   Paginated, 20 rows per page, newest first. */

const typeTags: Record<LedgerEntryType, string> = {
  Generation: "text-muted",
  Purchase: "text-accent",
  Refund: "text-info",
};

function TypeTag({ type }: { type: LedgerEntryType }) {
  return (
    <span className={cn("text-xs font-medium", typeTags[type])}>{type}</span>
  );
}

export function LedgerTable({
  entries,
  page,
  pageSize,
  total,
}: {
  entries: LedgerEntry[];
  page: number;
  pageSize: number;
  total: number;
}) {
  if (entries.length === 0) {
    return <EmptyState icon={Receipt} message="No transactions yet." />;
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-125">
          <thead>
            <tr className="text-left">
              <th scope="col" className="px-4 py-3 text-xs font-medium text-faint">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-faint">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-faint">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-faint">
                Balance after
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-line">
                <td className="px-4 py-3 text-sm whitespace-nowrap text-muted">
                  {formatDate(entry.created_at)}
                </td>
                <td className="px-4 py-3">
                  <TypeTag type={entry.type} />
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono text-sm whitespace-nowrap",
                    entry.amount > 0 ? "text-accent" : "text-fg",
                  )}
                >
                  {formatSignedCredits(entry.amount)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm whitespace-nowrap text-muted">
                  {formatSignedCredits(entry.balance_after).replace("+", "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <nav
          aria-label="Ledger pagination"
          className="flex items-center justify-between gap-4 border-t border-line px-4 pt-4"
        >
          <p className="text-xs text-muted">
            Page <span className="font-mono">{page}</span> of{" "}
            <span className="font-mono">{pageCount}</span>
          </p>
          <div className="flex gap-2">
            <PageLink page={page - 1} disabled={page <= 1}>
              Previous
            </PageLink>
            <PageLink page={page + 1} disabled={page >= pageCount}>
              Next
            </PageLink>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  children,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex h-8 items-center rounded-[var(--radius-control)] border border-line px-3 text-sm";

  if (disabled) {
    return (
      <span aria-disabled="true" className={cn(className, "text-faint opacity-40")}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={`/dashboard/billing?page=${page}`}
      scroll={false}
      className={cn(className, "text-muted transition-colors hover:border-line-strong hover:text-fg")}
    >
      {children}
    </Link>
  );
}
