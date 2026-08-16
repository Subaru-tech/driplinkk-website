import { Boxes, CreditCard, LayoutDashboard, Truck, UserCog, type LucideIcon } from "lucide-react";

/** Spec §5 — Overview / My Models / Mart Orders / Billing / Account. */
export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom tab bar. */
  shortLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", shortLabel: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/models", label: "My Models", shortLabel: "Models", icon: Boxes },
  { href: "/dashboard/mart-orders", label: "Mart Orders", shortLabel: "Orders", icon: Truck },
  { href: "/dashboard/billing", label: "Credits & Billing", shortLabel: "Billing", icon: CreditCard },
  { href: "/dashboard/account", label: "Account", shortLabel: "Account", icon: UserCog },
];

/** Page title shown in the top bar. Longest match wins. */
export function titleForPath(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}
