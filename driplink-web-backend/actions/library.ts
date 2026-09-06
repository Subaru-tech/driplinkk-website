"use server";

import { revalidatePath } from "next/cache";
import { getUnifiedUser } from "@/driplink-web-backend/auth/clerk";
import { getSupabaseServerClient } from "@/driplink-web-backend/db/client";

export type ClaimResult = {
  success: boolean;
  error?: string;
};

/**
 * Claims a free marketplace listing into the user's library.
 * Works seamlessly for both Clerk and Supabase authenticated users.
 */
export async function claimFreeListing(listingId: string): Promise<ClaimResult> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "Please sign in to add this model to your library." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Database backend is not connected." };
  }

  // 1. Verify listing is active and free
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, price_inr")
    .eq("id", listingId)
    .maybeSingle();

  if (listingErr || !listing) {
    return { success: false, error: "Model not found." };
  }

  if (listing.price_inr > 0) {
    return { success: false, error: "This model requires purchase." };
  }

  // 2. Insert into library_items
  const { error: insertErr } = await supabase.from("library_items").insert({
    user_id: user.id,
    listing_id: listingId,
    source: "free",
  });

  if (insertErr) {
    // Error code 23505: unique constraint violation = already in library
    if (insertErr.code === "23505") {
      return { success: true };
    }
    console.error("Failed to add to library_items:", insertErr);
    return { success: false, error: insertErr.message || "Failed to add to library." };
  }

  revalidatePath("/dashboard/library");
  return { success: true };
}
