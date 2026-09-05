import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseServerClient, getCurrentUser as getSupabaseUser } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

export const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export type UnifiedUser = {
  id: string; // Internal profiles.id (UUID)
  authId: string; // Clerk user_xxx or Supabase auth.users UUID
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  source: "clerk" | "supabase";
};

/**
 * Ensures a Clerk user has a corresponding row in Supabase's `public.profiles`.
 * Returns the Supabase profile row (with its internal UUID and role).
 */
export async function syncClerkProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  // 1. Check if profile already exists for this Clerk ID
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_id", userId)
    .maybeSingle();

  if (existing) {
    return existing as Profile;
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email?.split("@")[0] ||
    "Creator";
  const avatarUrl = clerkUser.imageUrl || null;

  // 2. Insert new profile
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      clerk_id: userId,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "creator",
      credits_balance: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create Supabase profile for Clerk user:", error);
    return null;
  }

  return created as Profile;
}

/**
 * Returns the currently signed-in user across either Clerk or Supabase.
 */
export async function getUnifiedUser(): Promise<UnifiedUser | null> {
  if (isClerkConfigured) {
    const { userId } = await auth();
    if (userId) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        const profile = await syncClerkProfile();
        return {
          id: profile?.id ?? userId,
          authId: userId,
          email: clerkUser.emailAddresses?.[0]?.emailAddress ?? null,
          name: profile?.full_name ?? clerkUser.fullName ?? null,
          avatarUrl: profile?.avatar_url ?? clerkUser.imageUrl ?? null,
          source: "clerk",
        };
      }
    }
  }

  // Fallback to Supabase Auth
  const sbUser = await getSupabaseUser();
  if (sbUser) {
    return {
      id: sbUser.id,
      authId: sbUser.id,
      email: sbUser.email ?? null,
      name: (sbUser.user_metadata?.full_name as string | undefined) ?? null,
      avatarUrl: (sbUser.user_metadata?.avatar_url as string | undefined) ?? null,
      source: "supabase",
    };
  }

  return null;
}
