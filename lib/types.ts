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
