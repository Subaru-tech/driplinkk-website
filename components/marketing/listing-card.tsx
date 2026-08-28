import { Box } from "lucide-react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/marketplace";
import { formatCurrency } from "@/lib/format";
import type { PublicListing } from "@/lib/types";

/** One model in the browse grid. */
export function ListingCard({ listing }: { listing: PublicListing }) {
  const category = listing.category ? CATEGORIES[listing.category as keyof typeof CATEGORIES] : null;

  return (
    <Link
      href={`/models/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/20"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-raised">
        {listing.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- thumbnails live in Supabase storage at a runtime-configured origin
          <img
            src={listing.thumbnail_url}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center">
            <Box className="size-8 text-faint" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="truncate text-sm font-medium text-fg" title={listing.title}>
          {listing.title}
        </p>
        <p className="truncate text-xs text-muted">
          {listing.seller?.studio_name ?? "Unknown studio"}
          {category ? ` · ${category}` : ""}
        </p>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="font-mono text-sm font-medium text-fg">
            {listing.price_inr === 0 ? "Free" : formatCurrency(listing.price_inr)}
          </span>
          {listing.purchases > 0 ? (
            <span className="text-xs text-faint">{listing.purchases} sold</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
