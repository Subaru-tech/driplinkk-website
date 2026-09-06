"use server";

import { getUnifiedUser } from "@/driplink-web-backend/auth/clerk";
import { getSupabaseServerClient } from "@/driplink-web-backend/db/client";
import { SUPABASE_ANON_KEY } from "@/lib/supabase";

export type UploadSession = {
  userId: string;
  accessToken: string;
};

/**
 * Returns upload credentials for the currently signed-in user
 * (whether authenticated via Clerk or Supabase Auth).
 */
export async function getUploadSession(): Promise<UploadSession | null> {
  const user = await getUnifiedUser();
  if (!user) return null;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (authData.session?.access_token) {
        return {
          userId: user.id,
          accessToken: authData.session.access_token,
        };
      }
    } catch {
      // Ignore session lookup errors
    }
  }

  // For Clerk users, user.id is their internal profiles.id UUID.
  // We use SUPABASE_ANON_KEY for storage upload, authorized via public.can_upload_to_storage_folder policy.
  return {
    userId: user.id,
    accessToken: SUPABASE_ANON_KEY,
  };
}

/**
 * Records an uploaded model in the database linked to the verified user.
 */
export async function recordUploadedModel({
  name,
  storagePath,
  thumbnailUrl,
}: {
  name: string;
  storagePath: string;
  thumbnailUrl?: string | null;
}): Promise<{ data?: { id: string }; error?: string }> {
  const user = await getUnifiedUser();
  if (!user) {
    return { error: "You must be signed in to upload a model." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { error: "Backend database is not connected." };
  }

  const { data, error } = await supabase
    .from("models")
    .insert({
      owner_id: user.id,
      name,
      storage_path: storagePath,
      thumbnail_url: thumbnailUrl || null,
      credits_spent: 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to record model row:", error);
    return { error: error.message };
  }

  return { data };
}

/**
 * Updates an existing model's thumbnail URL.
 */
export async function updateModelThumbnail({
  id,
  thumbnailUrl,
}: {
  id: string;
  thumbnailUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Backend database not connected." };
  }

  const { error } = await supabase
    .from("models")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Failed to update thumbnail:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Records an uploaded listing in the marketplace linked to the verified seller.
 */
export async function recordUploadedListing({
  title,
  slug,
  description,
  priceInr,
  storagePath,
  fileBytes,
  thumbnailUrl,
  category,
  tags,
}: {
  title: string;
  slug: string;
  description: string;
  priceInr: number;
  storagePath: string;
  fileBytes: number;
  thumbnailUrl?: string | null;
  category?: string;
  tags?: string[];
}): Promise<{ data?: { id: string; slug: string }; error?: string }> {
  const user = await getUnifiedUser();
  if (!user) {
    return { error: "You must be signed in to create a listing." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { error: "Backend database is not connected." };
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title,
      slug,
      description,
      price_inr: priceInr,
      file_path: storagePath,
      file_bytes: fileBytes,
      thumbnail_url: thumbnailUrl || null,
      status: "active",
      category: category || "Other",
      tags: tags || [],
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Failed to record listing row:", error);
    return { error: error.message };
  }

  return { data };
}

/**
 * Deletes an uploaded model and its storage blob from model-files.
 */
export async function deleteUploadedModel(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "You must be signed in to delete a model." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Backend database not connected." };
  }

  // 1. Fetch model to get storage path and verify ownership
  const { data: model } = await supabase
    .from("models")
    .select("id, storage_path")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!model) {
    return { success: false, error: "Model not found or not owned by you." };
  }

  // 2. Remove file from storage
  if (model.storage_path) {
    await supabase.storage.from("model-files").remove([model.storage_path]);
  }

  // 3. Delete database row
  const { error } = await supabase
    .from("models")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Failed to delete model row:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
