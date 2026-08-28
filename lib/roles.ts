import { Boxes, Store, type LucideIcon } from "lucide-react";

/**
 * The two kinds of account.
 *
 * Everything role-shaped in the UI renders from this list — the login popup,
 * the sign-up form's extra fields, the post-login redirect. Adding a third
 * role means adding an entry here and a branch in the backend's
 * `handle_new_user()` trigger; no component needs editing.
 *
 * The role a visitor picks in the popup is a ROUTE HINT, not a credential. It
 * is verified against `profiles.role` on the server after sign-in
 * (`app/(auth)/actions.ts`), so choosing the wrong door gets a clear message,
 * never access.
 */

export const ROLE_IDS = ["creator", "seller"] as const;

export type UserRole = (typeof ROLE_IDS)[number];

export type RoleDefinition = {
  id: UserRole;
  /** Short label, used in badges and buttons. */
  label: string;
  /** First-person headline on the popup card. */
  headline: string;
  /** One line explaining who this is for. */
  blurb: string;
  /** Three concrete things this account can do — shown on the popup card. */
  capabilities: [string, string, string];
  icon: LucideIcon;
  /** Where this role lands after signing in. */
  home: string;
};

export const ROLES: Record<UserRole, RoleDefinition> = {
  creator: {
    id: "creator",
    label: "Creator",
    headline: "I'm here to make and print",
    blurb: "Generate models in LeaFF OS, upload your own, and send them to print.",
    capabilities: ["Generate & upload models", "Order prints from the Mart", "Buy and spend credits"],
    icon: Boxes,
    home: "/dashboard",
  },
  seller: {
    id: "seller",
    label: "Seller",
    headline: "I'm here to sell my models",
    blurb: "List your models on the Mart, track sales, and get paid out.",
    capabilities: ["List models for sale", "Track sales & downloads", "Receive payouts"],
    icon: Store,
    home: "/seller",
  },
};

export const ROLE_LIST: RoleDefinition[] = ROLE_IDS.map((id) => ROLES[id]);

/** Narrows an untrusted string (URL param, user metadata) to a real role. */
export function parseRole(value: unknown): UserRole | null {
  return typeof value === "string" && (ROLE_IDS as readonly string[]).includes(value)
    ? (value as UserRole)
    : null;
}

/** Where a signed-in user of this role belongs. */
export function homeForRole(role: UserRole): string {
  return ROLES[role].home;
}
