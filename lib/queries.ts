import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { LedgerEntry, MartOrder, Model, Profile } from "@/lib/types";

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

  const sort = MODEL_SORTS[options.sort ?? "newest"];

  let query = supabase
    .from("models")
    .select("id, name, thumbnail_url, credits_spent, created_at")
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

  const { count, error } = await supabase
    .from("models")
    .select("id", { count: "exact", head: true });

  if (error) return empty(0);
  return { data: count ?? 0, backendReady: true };
}
