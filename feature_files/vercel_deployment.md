# Vercel Deployment

## Summary
Documents the production deployment contract for Medley's Next.js App Router application on Vercel. Vercel detects the framework and uses the existing npm lockfile and `npm run build`; production integrations use runtime environment variables.

## Key Points
- **Build**: Import the repository into Vercel and keep its detected Next.js settings; no custom build configuration is required.
- **Runtime configuration**: Spotify PKCE needs `SPOTIFY_CLIENT_ID` and an exact production `SPOTIFY_REDIRECT_URI`; discovery needs `GOOGLE_AI_STUDIO_API_KEY`; Supabase auth and data access need `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SCHEMA=medley`.
- **Credentials**: The runtime does not need a Spotify Client Secret, Supabase secret key, database URL, or Supabase access token. Never put these credentials in feature parameter files.
- **Provider setup**: Register the production callback URL with Spotify. The Supabase `medley` schema must be activated and exposed in Data API settings before hosted data requests can succeed.
- **Preview deployments**: Spotify redirect URLs must match exactly; a preview hostname requires a separately registered callback and matching environment variable.
- **Function duration**: The song discovery route sets a 60-second maximum because its provider workflow can make several sequential Gemini requests.
- **Runtime files**: Server-side parameter readers use committed files in `parameter_files/`; these are part of the repository deployment input, not Vercel environment variables.

## Relevant Files
- `README.md`: Vercel setup and environment variable template.
- `.env.example`: Local and production variable names and examples.
- `package.json`: Next.js build script and runtime dependencies.
- `parameter_files/vercel_deployment.toml`: Reserved feature configuration; currently empty.
- `feature_files/spotify_client.md`: Spotify PKCE callback and permissions.
- `feature_files/supabase_auth.md`: Supabase shared-auth setup and schema selection.

## Dev Mode
HACKING

## State Log
- 2026-11-05: Documented Vercel build defaults, required production runtime variables, and Spotify/Supabase provider setup.
