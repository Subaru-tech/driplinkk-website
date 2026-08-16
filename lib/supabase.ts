import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (singleton) + shared config.
 *
 * NOTE ON THE SPEC: §9 lists a single `lib/supabase.ts`. On the web we need a
 * second, server-only client because the server client reads cookies via
 * `next/headers`, which cannot be imported into a client bundle. That lives in
 * `lib/supabase-server.ts`. The config below is the single source of truth for
 * both — the env vars are not duplicated.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * True once a real Supabase project is wired up (Track 2).
 *
 * Until then the app renders its real empty states rather than fabricating
 * data — the standing rule in spec §6. Nothing anywhere in this codebase
 * substitutes sample data when this is false.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let browserClient: SupabaseClient | null = null;

/** Returns null when Supabase isn't configured yet — callers must handle it. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  browserClient ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return browserClient;
}
