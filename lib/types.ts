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

export type ListingStatus = "draft" | "in_review" | "published" | "rejected" | "archived";

export type Listing = {
  id: string;
  title: string;
  slug: string;
  price_inr: number;
  status: ListingStatus;
  thumbnail_url: string | null;
  downloads: number;
  created_at: string;
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
