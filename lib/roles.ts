import { Boxes, ShieldCheck, Store, type LucideIcon } from "lucide-react";

/**
 * The kinds of account.
 *
 * Everything role-shaped in the UI renders from this list — the login popup,
 * the sign-up form's extra fields, the post-login redirect.
 */

export const ROLE_IDS = ["creator", "seller", "admin"] as const;

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
  admin: {
    id: "admin",
    label: "Admin",
    headline: "I'm here to manage the platform",
    blurb: "Review listings, route mart orders, and manage platform operations.",
    capabilities: ["Review submitted listings", "Manage & route mart orders", "System administration"],
    icon: ShieldCheck,
    home: "/admin/listings",
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
