import { AuthForm } from "./auth-form";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { loadSupabaseAuthParams } from "@/lib/supabase/params";

type LoginProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function LoginPage({ searchParams }: LoginProps) {
  const configured = isSupabaseConfigured();
  const supabaseEnv = getSupabaseEnv();
  const { postLoginRedirect } = loadSupabaseAuthParams();
  const { error } = await searchParams;
  const showMissingConfig = !configured || error === "missing_config";

  return (
    <main className="home-page">
      <div className="home-panel">
        <p className="eyebrow">Medley</p>
        <h1>Log in</h1>
        <p className="lede">
          Sign in with your Medley email and password to use the app.
        </p>
        {showMissingConfig && (
          <p className="config-notice">
            Supabase runtime values are missing. Start Medley through Daedalus
            so it can sync the active project environment, or set
            SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in this project&apos;s
            ignored .env file, then restart the dev server.
          </p>
        )}
        <AuthForm
          mode="login"
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
