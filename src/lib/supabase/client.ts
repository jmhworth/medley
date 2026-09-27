import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createBrowserSupabaseClient() {
  const { url, anonKey, schema } = getSupabaseEnv();
  return createBrowserClient(url, anonKey, { db: { schema } });
}
