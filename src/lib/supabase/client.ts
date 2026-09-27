import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient(
  url: string,
  publishableKey: string,
  schema: string,
) {
  return createBrowserClient(url, publishableKey, { db: { schema } });
}
