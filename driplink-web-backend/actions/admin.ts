"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { getUnifiedUser } from "@/driplink-web-backend/auth/clerk";
import { getSupabaseServiceClient } from "@/driplink-web-backend/db/client";
import { ensureAdmin } from "@/lib/admin-guard";

export type AdminActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Updates a listing's status to 'published' or 'rejected'.
 *
 * Writes go through the service-role client: RLS on `listings` doesn't grant
 * admins a client-posable update path, so the privilege lives here — behind a
 * server-verified role check, never behind data the browser sent.
 */
export async function updateListingStatusAdmin({
  listingId,
  status,
}: {
  listingId: string;
  status: "published" | "rejected";
}): Promise<AdminActionResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const { data: current, error: fetchErr } = await guard.client
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr || !current) {
    return { success: false, error: "Listing not found." };
  }

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "published") {
    updates.published_at = new Date().toISOString();
  }

  const { error } = await guard.client
    .from("listings")
    .update(updates)
    .eq("id", listingId);

  if (error) {
    console.error("Failed to update listing status:", error);
    return { success: false, error: error.message || "Failed to update listing." };
  }

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/models");
  return { success: true };
}

/**
 * Updates mart order fulfillment fields: assigned_vendor, vendor_notes, and status.
 */
export async function updateMartOrderAdmin({
  orderId,
  assignedVendor,
  vendorNotes,
  status,
}: {
  orderId: string;
  assignedVendor?: string | null;
  vendorNotes?: string | null;
  status?: string;
}): Promise<AdminActionResult> {
  const guard = await ensureAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const { data: current, error: fetchErr } = await guard.client
    .from("mart_orders")
    .select("id")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !current) {
    return { success: false, error: "Order not found." };
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (assignedVendor !== undefined) {
    updates.assigned_vendor = assignedVendor?.trim() || null;
  }
  if (vendorNotes !== undefined) {
    updates.vendor_notes = vendorNotes?.trim() || null;
  }
  if (status !== undefined) {
    // The database stores lowercase statuses; the UI sends Title Case.
    updates.status = status.toLowerCase();
  }

  const { error } = await guard.client
    .from("mart_orders")
    .update(updates)
    .eq("id", orderId);

  if (error) {
    console.error("Failed to update mart order fulfillment:", error);
    return { success: false, error: error.message || "Failed to update order." };
  }

  revalidatePath("/admin/mart-orders");
  revalidatePath("/admin");
  revalidatePath("/dashboard/mart-orders");
  revalidatePath(`/dashboard/mart-orders/${orderId}`);
  return { success: true };
}
