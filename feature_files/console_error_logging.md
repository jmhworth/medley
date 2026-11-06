# Console Error Logging

## Summary
Console error logging keeps actionable error objects visible in the browser console for client-side failures and in the Next.js server terminal for API and provider failures. Logs include a short operation label and the original error without request credentials or song payloads.

## Key Points
- **Client failures**: Failed collection, save, discovery, playback, playlist loading, and Supabase sign-in or sign-up operations log their error objects in the browser console while preserving their existing user-facing messages.
- **Server failures**: Spotify OAuth exchange, Spotify playlist and playback requests, listening-history fetches, and song persistence failures log their original errors in the server terminal.
- **Provider logs**: Song discovery already logs bounded Google AI Studio rejection details and per-keyword search counts.
- **Configuration**: This feature has no tunable runtime values.

## Relevant Files
- `src/app/playlist-browser.tsx`: Logs playlist-track loading failures in the browser console.
- `src/app/song-collection.tsx`: Logs collection loading and song save failures in the browser console.
- `src/app/song-discovery.tsx`: Logs discovery and playback failures in the browser console.
- `src/app/login/auth-form.tsx`: Logs Supabase sign-in and sign-up errors in the browser console.
- `src/app/api/spotify/callback/route.ts`: Logs Spotify OAuth token exchange failures.
- `src/app/api/spotify/play/route.ts`: Logs Spotify playback failures.
- `src/app/api/spotify/playlists/route.ts`: Logs playlist request failures.
- `src/app/api/spotify/playlists/[id]/tracks/route.ts`: Logs playlist-track request failures.
- `src/app/api/songs/collection/route.ts`: Logs Spotify listening-history failures.
- `src/app/api/songs/collection/route.ts`: Logs saved-song lookup failures while building the listening queue.
- `src/app/api/songs/save/route.ts`: Logs song persistence failures.
- `src/app/api/songs/moment/route.ts`: Logs listening-note persistence failures.
- `src/app/api/songs/discover/route.ts`: Logs Google AI Studio provider failures and search counts.
- `parameter_files/console_error_logging.toml`: Empty parameter file; logging has no tunable values.

## Dev Mode
HACKING

## State Log
- 2026-11-05: Added browser-console and server-terminal error logs to make failed app operations easier to diagnose.
