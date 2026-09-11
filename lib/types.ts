import type { OrderStatus } from "@/components/ui/status-pill";

/**
 * Shapes the dashboard reads from Supabase (Track 2).
 *
 * These describe the contract the UI is written against. Until the tables
 * exist, every query returns an empty result and the UI renders its real empty
 * state — no placeholder rows, ever.
 */

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  credits_balance: number;
  role?: "creator" | "seller" | "admin";
};

export type Model = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  /** Path inside the private `model-files` bucket. Null for models made in
      the desktop app before browser upload existed. */
  storage_path: string | null;
  credits_spent: number;
  created_at: string;
};

export type MartOrder = {
  id: string;
  /** Short human-facing reference, e.g. "DL-4821". Rendered in mono. */
  reference: string;
  model_name: string;
  status: OrderStatus;
  total_inr: number;
  created_at: string;
  shipping_address: string | null;
  assigned_vendor?: string | null;
  vendor_notes?: string | null;
  buyer?: { id: string; full_name: string | null } | null;
};

export type LedgerEntryType = "Generation" | "Purchase" | "Refund";

export type LedgerEntry = {
  id: string;
  created_at: string;
  type: LedgerEntryType;
  /** Positive for additions, negative for deductions. */
  amount: number;
  balance_after: number;
};

export type SessionRecord = {
  id: string;
  /** Best-effort device/browser guess, e.g. "Chrome on Linux". */
  device: string;
  last_active_at: string;
  is_current: boolean;
};

/* ------------------------------------------------------------- Seller side */

export type SellerProfile = {
  id: string;
  studio_name: string;
  slug: string;
  bio: string | null;
  /** unverified until payout details are confirmed with the provider. */
  payout_status: "unverified" | "pending" | "verified" | "rejected";
};

export type ListingStatus = "draft" | "in_review" | "published" | "rejected" | "archived" | "pending";

export type Listing = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  tags: string[];
  license: string;
  price_inr: number;
  status: ListingStatus;
  thumbnail_url: string | null;
  file_path: string | null;
  file_bytes: number | null;
  downloads: number;
  purchases: number;
  published_at: string | null;
  created_at: string;
};

/** A published listing as the public marketplace sees it: the listing plus
    the storefront it belongs to. The mesh path is deliberately absent — the
    file is the thing being sold. */
export type PublicListing = Omit<Listing, "file_path" | "file_bytes" | "status"> & {
  seller: { studio_name: string; slug: string } | null;
};

export type Sale = {
  id: string;
  listing_id: string;
  gross_inr: number;
  platform_fee_inr: number;
  net_inr: number;
  created_at: string;
};

export type PayoutState = "scheduled" | "processing" | "paid" | "failed";

export type Payout = {
  id: string;
  amount_inr: number;
  state: PayoutState;
  reference: string | null;
  created_at: string;
  paid_at: string | null;
};

/** A model the user has access to — free claim now, purchase later. */
export type LibraryItem = {
  id: string;
  listing_id: string;
  source: "free" | "purchase" | "gift";
  acquired_at: string;
  listing: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    file_path: string | null;
    license: string;
    seller: { studio_name: string } | null;
  } | null;
};

export type MarketplaceLicenseType = "standard" | "cc" | "commercial";
export type MarketplaceModelStatus = "draft" | "published";

export type MarketplaceModel = {
  id: string;
  seller_user_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  license_type: MarketplaceLicenseType;
  price: number;
  preview_image_paths: string[];
  file_path?: string;
  status: MarketplaceModelStatus;
  created_at: string;
  seller_name?: string;
  seller_avatar?: string | null;
  seller?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type AcquiredModel = {
  acquisition_id: string;
  acquired_at: string;
  license_type: MarketplaceLicenseType;
  model_id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  preview_image_paths: string[];
  file_path: string;
  seller_name: string;
};

