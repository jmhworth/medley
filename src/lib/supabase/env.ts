export function getSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL?.trim() ?? "",
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseEnv();
  return Boolean(url && publishableKey);
}
