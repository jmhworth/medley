import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient(url: string, publishableKey: string) {
  return createBrowserClient(url, publishableKey);
}
