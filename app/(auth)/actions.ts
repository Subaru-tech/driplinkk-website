"use server";

import { homeForRole } from "@/lib/roles";
import { getAccountRole } from "@/lib/account";

/**
 * Where to send someone after their password succeeds.
 *
 * Nobody is asked which side of the product they're on — the account already
 * knows, and asking could only ever produce a redundant answer or a wrong one.
 * This reads `profiles.role` on the server and answers.
 *
 * Falls back to the creator dashboard when there's no session to read or
 * Supabase isn't configured: it's the side every account has.
 */
export async function resolveHome(): Promise<string> {
  const account = await getAccountRole();
  return account ? homeForRole(account.role) : "/dashboard";
}
