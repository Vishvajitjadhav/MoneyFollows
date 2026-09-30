import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

/**
 * Browser Supabase client. Prefer Server Actions for data; use this only
 * for client-only needs (e.g. auth state listeners).
 */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
