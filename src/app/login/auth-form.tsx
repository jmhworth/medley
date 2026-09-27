"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
  redirectTo: string;
  configured: boolean;
  supabaseUrl: string;
  publishableKey: string;
};

export function AuthForm({
  mode,
  redirectTo,
  configured,
  supabaseUrl,
  publishableKey,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!configured) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    const supabase = createBrowserSupabaseClient(supabaseUrl, publishableKey);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label className="auth-label">
        Email
        <input
          className="auth-input"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="auth-label">
        Password
        <input
          className="auth-input"
          type="password"
          name="password"
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {message ? <p className="auth-error">{message}</p> : null}
      <button className="primary-link auth-submit" type="submit">
        {mode === "login" ? "Log in" : "Sign up"}
      </button>
      <p className="auth-switch">
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <Link href="/signup" prefetch={false}>
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" prefetch={false}>
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
