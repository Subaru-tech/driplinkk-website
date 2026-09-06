"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { getUnifiedUser } from "@/driplink-web-backend/auth/clerk";
import { getSupabaseServerClient } from "@/driplink-web-backend/db/client";
import type { OrderStatus } from "@/components/ui/status-pill";

export type AdminActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Checks if the current authenticated user has the 'admin' role in profiles.
 */
async function verifyAdminCaller() {
  const user = await getUnifiedUser();
  if (!user) {
    return { ok: false as const, error: "You must be signed in to perform this action." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Database backend is not connected." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    return { ok: false as const, error: "Unauthorized: Admin privileges required." };
  }

  return { ok: true as const, supabase, user };
}

/**
 * Updates a listing's status to 'published' or 'rejected'.
 */
export async function updateListingStatusAdmin({
  listingId,
  status,
}: {
  listingId: string;
  status: "published" | "rejected";
}): Promise<AdminActionResult> {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const { supabase } = authCheck;
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "published") {
    updates.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", listingId);

  if (error) {
    console.error("Failed to update listing status:", error);
    return { success: false, error: error.message || "Failed to update listing." };
  }

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/mart");
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
  status?: OrderStatus;
}): Promise<AdminActionResult> {
  const authCheck = await verifyAdminCaller();
  if (!authCheck.ok) {
    return { success: false, error: authCheck.error };
  }

  const { supabase } = authCheck;
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
    updates.status = status;
  }

  const { error } = await supabase
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
  revalidatePath("/dashboard/mart-orders/[id]", "page");
  return { success: true };
}
