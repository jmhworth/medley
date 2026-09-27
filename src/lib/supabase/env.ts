export function getSupabaseEnv() {
  return {
    url: process.env.SUPABASE_URL?.trim() ?? "",
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
    schema: process.env.SUPABASE_SCHEMA?.trim() || "medley",
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseEnv();
  return Boolean(url && publishableKey);
}
