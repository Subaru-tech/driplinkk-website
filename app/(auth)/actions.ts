"use server";

import { homeForRole, ROLES, type UserRole } from "@/lib/roles";
import { getAccountRole } from "@/lib/account";

/**
 * Called by the login form right after the password succeeds.
 *
 * The role the visitor picked in the popup is a route hint the browser
 * supplied, so it is never the answer — this reads the account's real role and
 * says where to go. A mismatch is reported, not silently corrected: someone who
 * clicked "Seller" and has a creator account should be told that, not quietly
 * dropped into a dashboard they didn't ask for.
 */
export type RoleResolution =
  | { status: "ok"; role: UserRole; home: string }
  | { status: "mismatch"; role: UserRole; home: string; message: string }
  /** No session, or Supabase isn't configured — the caller falls back. */
  | { status: "unknown" };

export async function resolveSignedInRole(chosen: UserRole): Promise<RoleResolution> {
  const account = await getAccountRole();
  if (!account) return { status: "unknown" };

  const home = homeForRole(account.role);

  /* Only a role read straight from `profiles` is solid enough to contradict
     the user with. A metadata or default answer routes silently. */
  if (account.source === "profile" && account.role !== chosen) {
    return {
      status: "mismatch",
      role: account.role,
      home,
      message:
        `This is a ${ROLES[account.role].label} account, not a ${ROLES[chosen].label} one. ` +
        `Continue to your ${ROLES[account.role].label.toLowerCase()} dashboard, or log in with a different account.`,
    };
  }

  return { status: "ok", role: account.role, home };
}
