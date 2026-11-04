# Supabase Auth

## Summary
Hosted Supabase Auth for Medley email/password login and signup. App Router cookie sessions via `@supabase/ssr`; middleware refreshes the session and hard-gates the app so only `/login`, `/signup`, and static assets are public. Supabase clients select the project schema from `SUPABASE_SCHEMA` (default `medley`) while reusing the shared auth session.

## Key Points
- **Sign-in**: Email + password only. Confirm email should be disabled in the Supabase Auth dashboard when signup should return a session immediately (no confirm callback route); this Auth setting does not determine whether runtime configuration exists.
- **Hard gate**: Unauthenticated requests redirect to `/login`. Spotify connect/browse sit behind Medley login; Spotify cookies stay a separate namespace.
- **Credentials**: The server reads `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; login/signup pages pass these public connection values to the browser auth form. No secret/service-role key enters the client app or parameter files.
- **Missing config**: When URL/publishable key are absent from the Next.js process environment, login/signup explain Daedalus environment sync and local ignored `.env` setup; middleware still treats the user as logged out.
- **Redirect**: After login/signup, send the user to `post_login_redirect` from the parameter file (default `/`).

## Relevant Files
- `src/lib/supabase/env.ts`: Public env reader + `isSupabaseConfigured`.
- `src/lib/supabase/params.ts`: Reads `post_login_redirect` from the parameter file.
- `src/lib/supabase/client.ts`: Browser anon client configured for the project schema.
- `src/lib/supabase/server.ts`: Cookie-authenticated server client configured for the project schema.
- `src/lib/supabase/middleware.ts`: Session refresh + hard-gate redirect helper.
- `src/lib/supabase/auth.ts`: `getMedleyUser` session helper.
- `src/middleware.ts`: Next.js middleware entry (refresh + gate).
- `src/app/login/page.tsx`: Login page + form.
- `src/app/signup/page.tsx`: Signup page + form.
- `src/app/auth/logout/route.ts`: Clears the Supabase session.
- `src/app/page.tsx`: Home header Medley session / logout links (Spotify UI unchanged in role).
- `parameter_files/supabase_auth.toml`: Non-secret redirects/toggles.
- `.env.example` / `README.md`: Personalized project startup, Daedalus environment sync, local `.env` setup, and separate signup Confirm-email guidance.
- `feature_files/song_database.md`: User-owned song data consumer of the shared auth session.

## Dev Mode
HACKING

## State Log
- 2026-09-07: Initialized feature file for hosted Supabase email/password auth scaffolding.
- 2026-09-07: Shipped hosted Supabase email/password clients, hard-gate middleware, login/signup/logout UI, and env docs; left JSON song DB unchanged.
- 2026-09-26: Switched Supabase auth to the canonical `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` variables and passed them from server pages to the browser auth form.
- 2026-09-26: Configured cookie, middleware, and browser clients to use the project Supabase schema while retaining shared user authentication.
- 2026-11-04: Clarified that runtime Supabase values come from Daedalus sync or the project `.env`, prevented `.env.local` override confusion, and separated signup Confirm-email guidance from missing configuration.
