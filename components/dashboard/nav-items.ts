import {
  Boxes,
  Briefcase,
  CreditCard,
  LayoutDashboard,
  LibraryBig,
  Package,
  Printer,
  ReceiptIndianRupee,

  Store,
  Truck,
  UserCog,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Spec §5 — Overview / My Models / My Library / Mart Orders / Billing / Account. */
export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the mobile bottom tab bar. */
  shortLabel: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/dashboard/library", label: "My Library", shortLabel: "Library", icon: LibraryBig },
  { href: "/dashboard/models", label: "My Models", shortLabel: "Models", icon: Boxes },
  { href: "/dashboard/mart-orders", label: "Mart Orders", shortLabel: "Orders", icon: Truck },
  { href: "/dashboard/vendor", label: "Vendor Hub", shortLabel: "Vendor", icon: Printer },
  { href: "/dashboard/freelance-requests", label: "Hire Requests", shortLabel: "Hires", icon: Briefcase },
  { href: "/dashboard/freelancer", label: "Specialist Jobs", shortLabel: "Jobs", icon: Wrench },
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

/** The admin area — /admin/*. Review pending listings and fulfill orders. */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/listings", label: "Pending Listings", shortLabel: "Listings", icon: Package },
  { href: "/admin/mart-orders", label: "Mart Orders", shortLabel: "Orders", icon: Truck },
  { href: "/dashboard", label: "Creator App", shortLabel: "Creator", icon: LayoutDashboard },
];

/** Page title shown in the top bar. Longest match wins. */
export function titleForPath(pathname: string, items: NavItem[] = NAV_ITEMS): string {
  const match = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}
