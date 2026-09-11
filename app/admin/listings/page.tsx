import { Box, Package } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ListingReviewActions } from "@/components/admin/listing-actions";
import { ModelReviewActions } from "@/components/admin/model-actions";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminPendingListings, getAdminPendingModels } from "@/driplink-web-backend";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin — Pending Reviews | DripLink" };
export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const [{ data: listings }, { data: models }] = await Promise.all([
    getAdminPendingListings(),
    getAdminPendingModels(),
  ]);

  const totalPending = listings.length + models.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            Pending Marketplace Reviews
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Inspect creator submissions, verify CAD file integrity, and approve models for the marketplace.
          </p>
        </div>
        <StatusPill tone={totalPending > 0 ? "warning" : "neutral"} className="w-fit">
          {totalPending} awaiting review
        </StatusPill>
      </div>

      {/* SECTION 1: 3D CAD Models Pending Review */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-accent" />
            <h3 className="font-display text-base font-semibold text-fg">
              3D CAD Models ({models.length})
            </h3>
          </div>
          <span className="text-xs text-muted">Models entering /models catalog</span>
        </div>

        {models.length === 0 ? (
          <Card>
            <EmptyState
              icon={Box}
              size="sm"
              message="No 3D models currently waiting for admin review."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-raised/40 font-semibold uppercase tracking-wider text-faint text-[10px]">
                    <th scope="col" className="px-4 py-3">Model</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Creator</th>
                    <th scope="col" className="px-4 py-3">License</th>
                    <th scope="col" className="px-4 py-3">Price</th>
                    <th scope="col" className="px-4 py-3">Submitted</th>
                    <th scope="col" className="px-4 py-3 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {models.map((model) => (
                    <tr key={model.id} className="hover:bg-raised/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-raised">
                            {model.thumbnail_url ? (
                              <Image
                                src={model.thumbnail_url}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="grid size-full place-items-center text-muted">
                                <Box className="size-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-fg">{model.title}</p>
                            <p className="truncate font-mono text-[11px] text-muted">/{model.slug || model.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-muted">
                        <span className="rounded bg-surface px-2 py-0.5 text-[11px] border border-line">
                          {model.category || "Mechanical"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-muted font-medium">
                        {model.seller_name || "DripLink Creator"}
                      </td>

                      <td className="px-4 py-3.5 text-accent font-medium">
                        {(model.license_type || "standard").toUpperCase()}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-medium text-fg">
                        {model.price === 0 ? <span className="text-accent">Free</span> : formatCurrency(model.price)}
                      </td>

                      <td className="px-4 py-3.5 text-muted">
                        {formatDate(model.created_at)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <ModelReviewActions modelId={model.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* SECTION 2: Mart Legacy Listings */}
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted" />
            <h3 className="font-display text-base font-semibold text-fg">
              Mart Listings ({listings.length})
            </h3>
          </div>
          <span className="text-xs text-muted">Listings entering Mart store</span>
        </div>

        {listings.length === 0 ? (
          <Card>
            <EmptyState
              icon={Package}
              size="sm"
              message="No Mart listings currently waiting for approval."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-raised/40 font-semibold uppercase tracking-wider text-faint text-[10px]">
                    <th scope="col" className="px-4 py-3">Listing</th>
                    <th scope="col" className="px-4 py-3">Seller</th>
                    <th scope="col" className="px-4 py-3">Price</th>
                    <th scope="col" className="px-4 py-3">Submitted</th>
                    <th scope="col" className="px-4 py-3 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-raised/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-raised">
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
                            <p className="truncate font-semibold text-fg">{listing.title}</p>
                            <p className="truncate font-mono text-[11px] text-muted">/{listing.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-muted">
                        {listing.seller?.studio_name ?? "Independent Seller"}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-fg">
                        {formatCurrency(listing.price_inr)}
                      </td>

                      <td className="px-4 py-3.5 text-muted">
                        {formatDate(listing.created_at)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <ListingReviewActions listingId={listing.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
