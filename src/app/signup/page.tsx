import { AuthForm } from "../login/auth-form";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { loadSupabaseAuthParams } from "@/lib/supabase/params";

type SignupProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function SignupPage({ searchParams }: SignupProps) {
  const configured = isSupabaseConfigured();
  const supabaseEnv = getSupabaseEnv();
  const { postLoginRedirect } = loadSupabaseAuthParams();
  const { error } = await searchParams;
  const showMissingConfig = !configured || error === "missing_config";

  return (
    <main className="home-page">
      <div className="home-panel">
        <p className="eyebrow">Medley</p>
        <h1>Sign up</h1>
        <p className="lede">
          Create a Medley account with email and password. Confirm email should
          be off in Supabase so you can start right away.
        </p>
        {showMissingConfig && (
          <p className="config-notice">
            Supabase is not configured yet. Set SUPABASE_URL and
            SUPABASE_PUBLISHABLE_KEY, disable Confirm email
            in the Supabase Auth settings, then restart the dev server.
          </p>
        )}
        <AuthForm
          mode="signup"
          redirectTo={postLoginRedirect}
          configured={configured}
          supabaseUrl={supabaseEnv.url}
          publishableKey={supabaseEnv.publishableKey}
        />
      </div>
    </main>
  );
}
