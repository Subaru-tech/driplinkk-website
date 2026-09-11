"use server";

import { revalidatePath } from "next/cache";
import { getUnifiedUser } from "@/driplink-web-backend/auth/clerk";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/driplink-web-backend/db/client";

export type ClaimResult = {
  success: boolean;
  error?: string;
  message?: string;
  alreadyAcquired?: boolean;
};

export type DownloadUrlResult = {
  success: boolean;
  error?: string;
  downloadUrl?: string;
};

/**
 * Claims a free model into the user's library (model_acquisitions table).
 * Enforces price = 0 check on the server, ensuring paid models cannot be claimed.
 * Handles duplicate claims gracefully with a friendly message.
 */
export async function claimFreeModel(modelId: string): Promise<ClaimResult> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "Please sign in to add this model to your library." };
  }

  const serviceSupabase = getSupabaseServiceClient();
  const supabase = await getSupabaseServerClient();
  if (!serviceSupabase || !supabase) {
    return { success: false, error: "Database backend is not connected." };
  }

  try {
    // 1. Try atomic PostgreSQL RPC function with service role
    const { data: rpcRes, error: rpcErr } = await serviceSupabase.rpc("claim_model_acquisition", {
      p_user_id: user.id,
      p_model_id: modelId,
    });

    if (!rpcErr && rpcRes) {
      const parsed = typeof rpcRes === "string" ? JSON.parse(rpcRes) : rpcRes;
      if (!parsed.success) {
        return { success: false, error: parsed.error || "Failed to claim model." };
      }

      revalidatePath(`/models/${modelId}`);
      revalidatePath("/dashboard/library");
      return {
        success: true,
        message: parsed.message || "Added to your library.",
        alreadyAcquired: Boolean(parsed.already_acquired),
      };
    }

    // 2. Direct fallback
    const { data: model, error: modelErr } = await supabase
      .from("models")
      .select("id, price, license_type, status")
      .eq("id", modelId)
      .maybeSingle();

    if (modelErr || !model) {
      return { success: false, error: "Model not found." };
    }

    if (model.status !== "published") {
      return { success: false, error: "This model is not available." };
    }

    // Server-side payment barrier: reject any non-zero price model
    if (Number(model.price) > 0) {
      return {
        success: false,
        error: "Paid models cannot be claimed directly. Payment processing is coming soon.",
      };
    }

    // Check if already acquired
    const { data: existingAcq } = await supabase
      .from("model_acquisitions")
      .select("id")
      .eq("user_id", user.id)
      .eq("model_id", modelId)
      .maybeSingle();

    if (existingAcq) {
      return {
        success: true,
        message: "This model is already in your library.",
        alreadyAcquired: true,
      };
    }

    // Insert new acquisition
    const { error: insertErr } = await supabase.from("model_acquisitions").insert({
      user_id: user.id,
      model_id: modelId,
      license_type: model.license_type || "standard",
    });

    if (insertErr) {
      // Code 23505: unique constraint violation
      if (insertErr.code === "23505") {
        return {
          success: true,
          message: "This model is already in your library.",
          alreadyAcquired: true,
        };
      }
      console.error("Failed to insert into model_acquisitions:", insertErr);
      return { success: false, error: insertErr.message || "Failed to claim model." };
    }

    revalidatePath(`/models/${modelId}`);
    revalidatePath("/dashboard/library");
    return { success: true, message: "Added to your library." };
  } catch (err) {
    console.error("claimFreeModel exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }
}

/**
 * Generates a signed, time-limited download URL for an acquired model file.
 * The raw storage file_path is never exposed publicly to unauthenticated users.
 */
export async function getModelDownloadUrl(modelId: string): Promise<DownloadUrlResult> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "Please sign in to download this model." };
  }

  const serviceSupabase = getSupabaseServiceClient();
  const supabase = await getSupabaseServerClient();
  if (!serviceSupabase || !supabase) {
    return { success: false, error: "Database backend is not connected." };
  }

  try {
    // 1. Verify user acquired this model or owns it (privileged check)
    let hasAccess = false;
    const { data: rpcAccess, error: rpcAccessErr } = await serviceSupabase.rpc(
      "can_user_access_model_file",
      { p_user_id: user.id, p_model_id: modelId }
    );

    if (!rpcAccessErr && typeof rpcAccess === "boolean") {
      hasAccess = rpcAccess;
    } else {
      const { data: acquisition } = await supabase
        .from("model_acquisitions")
        .select("id")
        .eq("user_id", user.id)
        .eq("model_id", modelId)
        .maybeSingle();

      hasAccess = Boolean(acquisition);
    }

    const { data: model, error: modelErr } = await supabase
      .from("models")
      .select("id, file_path, title, seller_user_id, owner_id")
      .eq("id", modelId)
      .maybeSingle();

    if (modelErr || !model) {
      return { success: false, error: "Model file not found." };
    }

    const isOwner = model.seller_user_id === user.id || model.owner_id === user.id;

    if (!hasAccess && !isOwner) {
      return { success: false, error: "You must add this model to your library first." };
    }

    if (!model.file_path) {
      return { success: false, error: "No download file is associated with this model." };
    }

    // 2. Generate signed URL (valid for 1 hour)
    const { data: signData, error: signErr } = await supabase.storage
      .from("model-files")
      .createSignedUrl(model.file_path, 3600, {
        download: true,
      });

    if (signErr || !signData?.signedUrl) {
      console.error("Failed to generate signed URL:", signErr);
      return { success: false, error: "Failed to generate download link." };
    }

    return { success: true, downloadUrl: signData.signedUrl };
  } catch (err) {
    console.error("getModelDownloadUrl exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate download link.",
    };
  }
}

/**
 * Claims a free marketplace listing into the user's library (legacy support).
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

  const { error: insertErr } = await supabase.from("library_items").insert({
    user_id: user.id,
    listing_id: listingId,
    source: "free",
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { success: true, message: "Already in your library." };
    }
    console.error("Failed to add to library_items:", insertErr);
    return { success: false, error: insertErr.message || "Failed to add to library." };
  }

  revalidatePath("/dashboard/library");
  return { success: true, message: "Added to your library." };
}
