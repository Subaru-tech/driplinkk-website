"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { updateListingStatusAdmin } from "@/driplink-web-backend/actions/admin";

export function ListingReviewActions({ listingId }: { listingId: string }) {
  const [loadingAction, setLoadingAction] = useState<"approve" | "reject" | null>(null);
  const toast = useToast();

  async function handleApprove() {
    setLoadingAction("approve");
    try {
      const res = await updateListingStatusAdmin({ listingId, status: "published" });
      if (res.success) {
        toast("success", "Listing approved and published to the Mart.");
      } else {
        toast("error", res.error || "Failed to approve listing.");
      }
    } catch {
      toast("error", "An unexpected error occurred while approving the listing.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleReject() {
    setLoadingAction("reject");
    try {
      const res = await updateListingStatusAdmin({ listingId, status: "rejected" });
      if (res.success) {
        toast("warning", "Listing rejected.");
      } else {
        toast("error", res.error || "Failed to reject listing.");
      }
    } catch {
      toast("error", "An unexpected error occurred while rejecting the listing.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        loading={loadingAction === "approve"}
        disabled={loadingAction !== null}
        onClick={handleApprove}
        aria-label="Approve listing"
      >
        <Check className="size-3.5" aria-hidden="true" />
        Approve
      </Button>

      <Button
        variant="danger"
        size="sm"
        loading={loadingAction === "reject"}
        disabled={loadingAction !== null}
        onClick={handleReject}
        aria-label="Reject listing"
      >
        <X className="size-3.5" aria-hidden="true" />
        Reject
      </Button>
    </div>
  );
}
