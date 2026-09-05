import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getUnifiedUser, isClerkConfigured, syncClerkProfile } from "@/lib/clerk-supabase";
import { LISTING_SORTS, type Category, type ListingSort } from "@/lib/marketplace";
import type {
  LedgerEntry,
  LibraryItem,
  Listing,
  PublicListing,
  MartOrder,
  Model,
  Payout,
  Profile,
  Sale,
  SellerProfile,
} from "@/lib/types";

/**
 * Dashboard data access.
 *
 * Per the spec's standing rule (§6): these are real Supabase calls from day
 * one. Until Track 2 is deployed they return empty results and every page
 * renders its real empty state. Nothing here ever substitutes sample data.
 */

export type QueryResult<T> = {
  data: T;
  /** False when the query could not reach real tables (not yet deployed). */
  backendReady: boolean;
};

/**
 * Any query error (most often Postgres `42P01 undefined_table`, before the
 * schema is deployed) degrades to an empty result plus `backendReady: false`.
 * The page then shows its real empty state instead of throwing.
 */
function empty<T>(fallback: T): QueryResult<T> {
  return { data: fallback, backendReady: false };
}

export async function getProfile(): Promise<QueryResult<Profile | null>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(null);

  if (isClerkConfigured) {
    const profile = await syncClerkProfile();
    if (profile) return { data: profile, backendReady: true };
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return empty(null);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, credits_balance")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) return empty(null);
  return { data: (data as Profile) ?? null, backendReady: true };
}

/** Sort options offered by the My Models toolbar — spec §6.2. */
export const MODEL_SORTS = {
  newest: { label: "Newest", column: "created_at", ascending: false },
  oldest: { label: "Oldest", column: "created_at", ascending: true },
  name: { label: "Name", column: "name", ascending: true },
} as const;

export type ModelSort = keyof typeof MODEL_SORTS;

export async function getModels(
  limit?: number,
  options: { search?: string; sort?: ModelSort } = {},
): Promise<QueryResult<Model[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  const user = await getUnifiedUser();
  if (!user) return empty([]);

  const sort = MODEL_SORTS[options.sort ?? "newest"];

  let query = supabase
    .from("models")
    .select("id, name, thumbnail_url, storage_path, credits_spent, created_at")
    .eq("owner_id", user.id)
    .order(sort.column, { ascending: sort.ascending });

  if (options.search) {
    /* Escape the LIKE wildcards so a literal % or _ in the query doesn't
       silently widen the match. */
    const escaped = options.search.replace(/[%_]/g, (char) => `\\${char}`);
    query = query.ilike("name", `%${escaped}%`);
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return empty([]);
  return { data: (data as Model[]) ?? [], backendReady: true };
}

export async function getMartOrders(limit?: number): Promise<QueryResult<MartOrder[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  let query = supabase
    .from("mart_orders")
    .select("id, reference, model_name, status, total_inr, created_at, shipping_address")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return empty([]);
  return { data: (data as MartOrder[]) ?? [], backendReady: true };
}

export async function getMartOrder(id: string): Promise<QueryResult<MartOrder | null>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(null);

  const { data, error } = await supabase
    .from("mart_orders")
    .select("id, reference, model_name, status, total_inr, created_at, shipping_address")
    .eq("id", id)
    .maybeSingle();

  if (error) return empty(null);
  return { data: (data as MartOrder) ?? null, backendReady: true };
}

export type LedgerPage = { entries: LedgerEntry[]; total: number };

/** Spec §6.4 — paginated, 20 rows per page, newest first. */
export async function getLedgerPage(page: number, pageSize = 20): Promise<QueryResult<LedgerPage>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty({ entries: [], total: 0 });

  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from("credit_ledger")
    .select("id, created_at, type, amount, balance_after", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) return empty({ entries: [], total: 0 });
  return {
    data: { entries: (data as LedgerEntry[]) ?? [], total: count ?? 0 },
    backendReady: true,
  };
}

export async function getActiveOrderCount(): Promise<QueryResult<number>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(0);

  const { count, error } = await supabase
    .from("mart_orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["Placed", "Confirmed", "Printing", "Shipped"]);

  if (error) return empty(0);
  return { data: count ?? 0, backendReady: true };
}

export async function getModelCount(): Promise<QueryResult<number>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(0);

  const user = await getUnifiedUser();
  if (!user) return empty(0);

  const { count, error } = await supabase
    .from("models")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (error) return empty(0);
  return { data: count ?? 0, backendReady: true };
}

/* ------------------------------------------------------------- Seller side
   Same rule as above: real queries from day one, empty results and a real
   empty state until the schema is deployed. */

export async function getSellerProfile(): Promise<QueryResult<SellerProfile | null>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(null);

  let userId: string | null = null;
  if (isClerkConfigured) {
    const profile = await syncClerkProfile();
    userId = profile?.id ?? null;
  }
  if (!userId) {
    const { data: auth } = await supabase.auth.getUser();
    userId = auth.user?.id ?? null;
  }
  if (!userId) return empty(null);

  const { data, error } = await supabase
    .from("seller_profiles")
    .select("id, studio_name, slug, bio, payout_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) return empty(null);
  return { data: (data as SellerProfile) ?? null, backendReady: true };
}

/** Every column the seller's own views need. The public browse deliberately
    asks for less — see `PUBLIC_LISTING_COLUMNS`. */
const LISTING_COLUMNS =
  "id, title, slug, description, category, tags, license, price_inr, status, " +
  "thumbnail_url, file_path, file_bytes, downloads, purchases, published_at, created_at";

/* No file_path here: the storage path of the mesh is the one thing a public
   page must never hand out. Buyers get a signed URL after a purchase. */
const PUBLIC_LISTING_COLUMNS =
  "id, title, slug, description, category, tags, license, price_inr, " +
  "thumbnail_url, downloads, purchases, published_at, created_at, " +
  "seller:seller_profiles(studio_name, slug)";

export async function getListings(limit?: number): Promise<QueryResult<Listing[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  const user = await getUnifiedUser();
  if (!user) return empty([]);

  let query = supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return empty([]);
  /* The column list is a const, not a literal, so PostgREST's generic can't
     infer the row shape — the cast is doing what the literal would. */
  return { data: (data as unknown as Listing[]) ?? [], backendReady: true };
}

export async function getPublishedListingCount(): Promise<QueryResult<number>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(0);

  const { count, error } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (error) return empty(0);
  return { data: count ?? 0, backendReady: true };
}

export async function getSales(limit?: number): Promise<QueryResult<Sale[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  let query = supabase
    .from("sales")
    .select("id, listing_id, gross_inr, platform_fee_inr, net_inr, created_at")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return empty([]);
  return { data: (data as Sale[]) ?? [], backendReady: true };
}

/** Lifetime net earnings, in rupees. */
export async function getSellerEarnings(): Promise<QueryResult<number>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(0);

  const { data, error } = await supabase.from("sales").select("net_inr");
  if (error) return empty(0);

  const total = ((data as { net_inr: number }[]) ?? []).reduce(
    (sum, row) => sum + row.net_inr,
    0,
  );
  return { data: total, backendReady: true };
}

export async function getPayouts(limit?: number): Promise<QueryResult<Payout[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  let query = supabase
    .from("payouts")
    .select("id, amount_inr, state, reference, created_at, paid_at")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) return empty([]);
  return { data: (data as Payout[]) ?? [], backendReady: true };
}

/** One of the seller's own listings, for the editor. */
export async function getSellerListing(id: string): Promise<QueryResult<Listing | null>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(null);

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return empty(null);
  return { data: (data as unknown as Listing) ?? null, backendReady: true };
}

/* ---------------------------------------------------------- Public browse
   These run for signed-out visitors too. The RLS policy on `listings` allows
   anyone to read rows with status 'published', so no service key and no
   separate public API are involved — the database is the filter. */

export async function getPublicListings(
  options: { category?: Category; search?: string; sort?: ListingSort; limit?: number } = {},
): Promise<QueryResult<PublicListing[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  const sort = LISTING_SORTS[options.sort ?? "newest"];

  let query = supabase
    .from("listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("status", "published")
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false });

  if (options.category) query = query.eq("category", options.category);
  if (options.search) {
    const escaped = options.search.replace(/[%_]/g, (char) => `\\${char}`);
    /* Title, description and tags — the listing editor tells sellers their
       tags are used for search, so they have to actually be searched. */
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%,tags.cs.{${escaped.toLowerCase()}}`,
    );
  }
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) return empty([]);
  return { data: (data as unknown as PublicListing[]) ?? [], backendReady: true };
}

export async function getPublicListing(slug: string): Promise<QueryResult<PublicListing | null>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty(null);

  const { data, error } = await supabase
    .from("listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) return empty(null);
  return { data: (data as unknown as PublicListing) ?? null, backendReady: true };
}

/** Category counts for the browse sidebar. One row per published listing is
    cheap here; when this stops being cheap it becomes a database view. */
export async function getCategoryCounts(): Promise<QueryResult<Record<string, number>>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty({});

  const { data, error } = await supabase
    .from("listings")
    .select("category")
    .eq("status", "published");

  if (error) return empty({});

  const counts: Record<string, number> = {};
  for (const row of (data as { category: string | null }[]) ?? []) {
    if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  return { data: counts, backendReady: true };
}

/* ------------------------------------------------------------- Library
   What the signed-in user has access to. The file path comes back here — it
   has to, so the library can mint a signed download URL — and the storage
   policy is what actually decides whether that URL works. */

export async function getLibrary(): Promise<QueryResult<LibraryItem[]>> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return empty([]);

  const { data, error } = await supabase
    .from("library_items")
    .select(
      "id, listing_id, source, acquired_at, " +
        "listing:listings(id, title, slug, thumbnail_url, file_path, license, " +
        "seller:seller_profiles(studio_name))",
    )
    .order("acquired_at", { ascending: false });

  if (error) return empty([]);
  return { data: (data as unknown as LibraryItem[]) ?? [], backendReady: true };
}

/** Whether the current user already has this listing. Null when signed out. */
export async function getLibraryEntry(listingId: string): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data } = await supabase
    .from("library_items")
    .select("id")
    .eq("listing_id", listingId)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}
