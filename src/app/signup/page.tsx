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
          Create a Medley account with your email and a password.
        </p>
        {showMissingConfig && (
          <p className="config-notice">
            Supabase runtime values are missing. Start Medley through Daedalus
            so it can sync the active project environment, or set
            SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in this project&apos;s
            ignored .env file, then restart the dev server.
          </p>
        )}
        <p className="lede">
          For signup to create a session immediately, turn off Confirm email
          under Authentication → Providers / Email in the Supabase Dashboard.
        </p>
        <AuthForm
          mode="signup"
          redirectTo={postLoginRedirect}
          configured={configured}
          supabaseUrl={supabaseEnv.url}
          publishableKey={supabaseEnv.publishableKey}
          schema={supabaseEnv.schema}
        />
      </div>
    </main>
  );
}
