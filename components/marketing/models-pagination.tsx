import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function ModelsPagination({
  currentPage,
  totalPages,
  totalItems,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function buildUrl(pageNumber: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, value);
      }
    }
    if (pageNumber > 1) {
      params.set("page", String(pageNumber));
    }
    const query = params.toString();
    return `/models${query ? `?${query}` : ""}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-6 sm:flex-row">
      <p className="text-xs text-muted">
        Showing page <span className="font-medium text-fg">{currentPage}</span> of{" "}
        <span className="font-medium text-fg">{totalPages}</span> ({totalItems} models total)
      </p>

      <div className="flex items-center gap-1.5">
        {currentPage > 1 ? (
          <Link
            href={buildUrl(currentPage - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-control)] border border-line bg-surface px-2.5 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-[var(--radius-control)] border border-line/40 bg-surface/50 px-2.5 text-xs font-medium text-faint">
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Previous
          </span>
        )}

        <div className="flex items-center gap-1">
          {pages.map((p) => {
            const isCurrent = p === currentPage;
            return (
              <Link
                key={p}
                href={buildUrl(p)}
                className={cn(
                  "grid size-8 place-items-center rounded-[var(--radius-control)] text-xs font-medium transition-colors",
                  isCurrent
                    ? "bg-accent text-accent-fg font-semibold shadow-xs"
                    : "border border-line bg-surface text-muted hover:bg-raised hover:text-fg"
                )}
                aria-current={isCurrent ? "page" : undefined}
              >
                {p}
              </Link>
            );
          })}
        </div>

        {currentPage < totalPages ? (
          <Link
            href={buildUrl(currentPage + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-control)] border border-line bg-surface px-2.5 text-xs font-medium text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-[var(--radius-control)] border border-line/40 bg-surface/50 px-2.5 text-xs font-medium text-faint">
            Next
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}
