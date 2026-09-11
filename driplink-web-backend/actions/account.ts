"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { getUnifiedUser, isClerkConfigured } from "@/driplink-web-backend/auth/clerk";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/driplink-web-backend/db/client";

export type UpdateProfileResult = {
  success: boolean;
  error?: string;
};

/**
 * Updates user full name and avatar across both Supabase profile and identity provider.
 */
export async function updateUserProfile({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl?: string | null;
}): Promise<UpdateProfileResult> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "You must be signed in to update your profile." };
  }

  const serviceSupabase = getSupabaseServiceClient();
  const supabase = await getSupabaseServerClient();
  const client = serviceSupabase ?? supabase;
  if (!client) {
    return { success: false, error: "Database backend is not connected." };
  }

  const trimmedName = fullName.trim();

  if (user.source === "clerk") {
    // 1. Update Supabase profile via the Security Definer RPC with service client
    const { error: rpcErr } = await client.rpc("sync_clerk_user_profile", {
      p_clerk_id: user.authId,
      p_full_name: trimmedName,
      p_avatar_url: avatarUrl ?? user.avatarUrl ?? null,
    });

    if (rpcErr) {
      console.error("Failed to sync updated Clerk profile to Supabase:", rpcErr);
      return { success: false, error: rpcErr.message || "Failed to update profile." };
    }

    // 2. Best-effort update to Clerk user record
    if (isClerkConfigured) {
      try {
        const clerk = await clerkClient();
        const parts = trimmedName.split(" ");
        const firstName = parts[0] || "";
        const lastName = parts.slice(1).join(" ") || "";
        await clerk.users.updateUser(user.authId, {
          firstName,
          lastName,
        });
      } catch (err) {
        console.warn("Clerk updateUser warning (non-fatal):", err);
      }
    }
  } else {
    // Supabase native auth
    const { error } = await client
      .from("profiles")
      .update({
        full_name: trimmedName,
        avatar_url: avatarUrl ?? user.avatarUrl ?? null,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update Supabase profile:", error);
      return { success: false, error: error.message || "Failed to update profile." };
    }
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Deletes user models, files, library items, and profile record.
 */
export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  const user = await getUnifiedUser();
  if (!user) {
    return { success: false, error: "You must be signed in to delete your account." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Database backend is not connected." };
  }

  try {
    // 1. Clean up user models & storage files
    const { data: userModels } = await supabase
      .from("models")
      .select("id, storage_path")
      .eq("owner_id", user.id);

    if (userModels && userModels.length > 0) {
      const storagePaths = userModels
        .map((m) => m.storage_path)
        .filter((p): p is string => Boolean(p));

      if (storagePaths.length > 0) {
        await supabase.storage.from("model-files").remove(storagePaths);
      }

      await supabase.from("models").delete().eq("owner_id", user.id);
    }

    // 2. Clean up user library items
    await supabase.from("library_items").delete().eq("user_id", user.id);

    // 3. Clean up profile record
    await supabase.from("profiles").delete().eq("id", user.id);

    // 4. Delete Clerk user if applicable
    if (user.source === "clerk" && isClerkConfigured) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(user.authId);
      } catch (err) {
        console.warn("Clerk deleteUser warning:", err);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("deleteUserAccount error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete account.",
    };
  }
}
