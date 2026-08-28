import {
  Boxes,
  CreditCard,
  LayoutDashboard,
  LibraryBig,
  Package,
  ReceiptIndianRupee,
  Store,
  Truck,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Spec §5 — Overview / My Models / Mart Orders / Billing / Account, plus My
    Library once the marketplace existed. Six items is the ceiling for the
    mobile tab bar: at 320px each gets ~53px, so `shortLabel` has to stay short
    (hence "Home" rather than "Overview"). A seventh needs a different pattern. */
export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom tab bar. */
  shortLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/dashboard/models", label: "My Models", shortLabel: "Models", icon: Boxes },
  { href: "/dashboard/library", label: "My Library", shortLabel: "Library", icon: LibraryBig },
  { href: "/dashboard/mart-orders", label: "Mart Orders", shortLabel: "Orders", icon: Truck },
  { href: "/dashboard/billing", label: "Credits & Billing", shortLabel: "Billing", icon: CreditCard },
  { href: "/dashboard/account", label: "Account", shortLabel: "Account", icon: UserCog },
];

/** The seller side of the house — /seller/*. Same shell, different doors. */
export const SELLER_NAV_ITEMS: NavItem[] = [
  { href: "/seller", label: "Overview", shortLabel: "Overview", icon: Store },
  { href: "/seller/listings", label: "My Listings", shortLabel: "Listings", icon: Package },
  { href: "/seller/sales", label: "Sales", shortLabel: "Sales", icon: ReceiptIndianRupee },
  { href: "/seller/payouts", label: "Payouts", shortLabel: "Payouts", icon: Wallet },
  { href: "/seller/account", label: "Account", shortLabel: "Account", icon: UserCog },
];

/** Page title shown in the top bar. Longest match wins. */
export function titleForPath(pathname: string, items: NavItem[] = NAV_ITEMS): string {
  const match = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}
