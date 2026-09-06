"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ORDER_STATUSES, type OrderStatus } from "@/components/ui/status-pill";
import { useToast } from "@/components/ui/toast";
import { updateMartOrderAdmin } from "@/driplink-web-backend/actions/admin";

export function OrderFulfillmentControl({
  orderId,
  initialVendor,
  initialNotes,
  initialStatus,
}: {
  orderId: string;
  initialVendor: string | null;
  initialNotes: string | null;
  initialStatus: OrderStatus;
}) {
  const [vendor, setVendor] = useState(initialVendor ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await updateMartOrderAdmin({
        orderId,
        assignedVendor: vendor,
        vendorNotes: notes,
        status,
      });

      if (res.success) {
        toast("success", "Order fulfillment updated successfully.");
      } else {
        toast("error", res.error || "Failed to update order fulfillment.");
      }
    } catch {
      toast("error", "An unexpected error occurred while updating the order.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Input
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
        placeholder="Assign vendor..."
        className="h-8 min-w-32 text-xs"
        aria-label="Assigned vendor"
      />

      <Input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Vendor notes..."
        className="h-8 min-w-36 text-xs"
        aria-label="Vendor notes"
      />

      <Select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        className="h-8 text-xs font-medium"
        aria-label="Order status"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      <Button
        variant="secondary"
        size="sm"
        loading={isSaving}
        onClick={handleSave}
        className="h-8 shrink-0 px-2.5 text-xs"
        aria-label="Save fulfillment changes"
      >
        <Save className="size-3.5" aria-hidden="true" />
        Save
      </Button>
    </div>
  );
}
