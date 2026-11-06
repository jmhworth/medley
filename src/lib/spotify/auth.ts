import crypto from "crypto";
import { cookies } from "next/headers";

const ACCESS_COOKIE = "spotify_access_token";
const REFRESH_COOKIE = "spotify_refresh_token";
const EXPIRES_COOKIE = "spotify_token_expires_at";
const VERIFIER_COOKIE = "spotify_pkce_verifier";
const STATE_COOKIE = "spotify_oauth_state";

function base64url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createCodeVerifier() {
  return base64url(crypto.randomBytes(32));
}

export function createCodeChallenge(verifier: string) {
  return base64url(crypto.createHash("sha256").update(verifier).digest());
}

export function createOAuthState() {
  return base64url(crypto.randomBytes(16));
}

export function getSpotifyEnv() {
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID?.trim() ?? "",
    redirectUri: process.env.SPOTIFY_REDIRECT_URI?.trim() ?? "",
  };
}

export function getSpotifyAppUrl(pathname: string, fallbackUrl: string) {
  const { redirectUri } = getSpotifyEnv();
  return new URL(pathname, redirectUri || fallbackUrl);
}

function cookieDefaults() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export function pkceCookieOptions() {
  return { ...cookieDefaults(), maxAge: 60 * 10 };
}

export function tokenCookieOptions(maxAgeSeconds: number) {
  return { ...cookieDefaults(), maxAge: maxAgeSeconds };
}

export function clearAuthCookieOptions() {
  return { ...cookieDefaults(), maxAge: 0 };
}

export const spotifyCookieNames = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  EXPIRES_COOKIE,
  VERIFIER_COOKIE,
  STATE_COOKIE,
};

export async function hasSpotifySession() {
  const jar = await cookies();
  return Boolean(jar.get(ACCESS_COOKIE)?.value || jar.get(REFRESH_COOKIE)?.value);
}

export async function getAccessToken() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const expiresAt = Number(jar.get(EXPIRES_COOKIE)?.value ?? 0);
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  // Still valid (60s buffer)
  if (access && Date.now() < expiresAt - 60_000) {
    return access;
  }

  if (!refresh) {
    return null;
  }

  const { clientId } = getSpotifyEnv();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: clientId,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    return null;
  }

  const data = await res.json();

  // HACKING: return refreshed access token for this request only.
  // Skipping cookie writes keeps this safe to call from Server Components.
  return typeof data.access_token === "string" ? data.access_token : null;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const { clientId, redirectUri } = getSpotifyEnv();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return res.json();
}
