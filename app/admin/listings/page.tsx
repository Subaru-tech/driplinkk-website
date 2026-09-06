import { Package } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ListingReviewActions } from "@/components/admin/listing-actions";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminPendingListings } from "@/driplink-web-backend";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Pending Listings" };
export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const { data: listings } = await getAdminPendingListings();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-fg">Pending Listings</h2>
          <p className="text-xs text-muted">
            Review submitted models before they appear in the public Mart.
          </p>
        </div>
        <StatusPill tone="warning" className="w-fit">
          {listings.length} awaiting review
        </StatusPill>
      </div>

      {listings.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            size="lg"
            message="No listings are currently waiting for approval."
          />
        </Card>
      ) : (
        <>
          {/* Desktop & iPad Pro Landscape Table (lg+) */}
          <div className="hidden lg:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line text-xs font-medium text-faint">
                      <th scope="col" className="px-4 py-3">
                        Model
                      </th>
                      <th scope="col" className="w-48 px-4 py-3">
                        Seller
                      </th>
                      <th scope="col" className="w-32 px-4 py-3">
                        Price
                      </th>
                      <th scope="col" className="w-36 px-4 py-3">
                        Submitted
                      </th>
                      <th scope="col" className="w-48 px-4 py-3 text-right">
                        Review
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-sm">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="transition-colors hover:bg-raised/50">
                        {/* Model info & thumbnail */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-line bg-raised">
                              {listing.thumbnail_url ? (
                                <Image
                                  src={listing.thumbnail_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="grid size-full place-items-center text-muted">
                                  <Package className="size-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-fg">{listing.title}</p>
                              <p className="truncate font-mono text-xs text-muted">/{listing.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Seller studio */}
                        <td className="px-4 py-3.5 text-muted">
                          {listing.seller?.studio_name ?? "Independent Seller"}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 font-mono text-fg">
                          {formatCurrency(listing.price_inr)}
                        </td>

                        {/* Submitted date */}
                        <td className="px-4 py-3.5 text-xs text-muted">
                          {formatDate(listing.created_at)}
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3.5 text-right">
                          <ListingReviewActions listingId={listing.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile & iPad/Tablet Cards (< lg: 1 col on mobile, 2 cols on tablet/iPad) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
            {listings.map((listing) => (
              <Card key={listing.id} className="flex flex-col justify-between gap-4 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-line bg-raised">
                      {listing.thumbnail_url ? (
                        <Image
                          src={listing.thumbnail_url}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-muted">
                          <Package className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-fg">{listing.title}</p>
                      <p className="font-mono text-xs text-muted">/{listing.slug}</p>
                      <p className="mt-1 text-xs text-muted">
                        Seller:{" "}
                        <span className="text-fg">
                          {listing.seller?.studio_name ?? "Independent Seller"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-3 text-xs">
                    <div>
                      <span className="text-muted">Price: </span>
                      <span className="font-mono font-medium text-fg">
                        {formatCurrency(listing.price_inr)}
                      </span>
                    </div>
                    <div className="text-muted">Submitted {formatDate(listing.created_at)}</div>
                  </div>
                </div>

                <div className="border-t border-line pt-3">
                  <ListingReviewActions listingId={listing.id} fullWidth />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
