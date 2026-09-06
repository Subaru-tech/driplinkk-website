import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import type { Listing, ListingStatus } from "@/lib/types";

const tones: Record<ListingStatus, StatusTone> = {
  draft: "neutral",
  in_review: "warning",
  pending: "warning",
  published: "accent",
  rejected: "danger",
  archived: "neutral",
};

const labels: Record<ListingStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  pending: "Pending",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

export function ListingStatusPill({ status }: { status: ListingStatus }) {
  return <StatusPill tone={tones[status]}>{labels[status]}</StatusPill>;
}

export function ListingRow({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/seller/listings/${listing.id}`}
      className="flex flex-wrap items-center gap-4 rounded-[var(--radius-control)] border-b border-line px-1 py-3 transition-colors last:border-b-0 hover:bg-raised"
    >
      <span className="min-w-0 flex-1 truncate text-sm text-fg">{listing.title}</span>
      <ListingStatusPill status={listing.status} />
      <span className="font-mono text-sm text-fg">{formatCurrency(listing.price_inr)}</span>
      <span className="w-24 text-right font-mono text-xs text-muted">
        {listing.downloads} sold
      </span>
      <span className="w-28 text-right text-xs text-muted">{formatDate(listing.created_at)}</span>
    </Link>
  );
}
