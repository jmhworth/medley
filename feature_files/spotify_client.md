# Spotify Client

## Summary
Connects a Spotify account via Authorization Code + PKCE (Client ID + Redirect URI only), browses the signed-in user's playlists, and supplies recently played tracks to the song collection queue. Playlist and recent-play history calls use the Spotify Web API. Tokens live in HTTP-only cookies; playlist page sizes come from the feature parameter file.

## Key Points
- **OAuth**: PKCE public-client flow — no Client Secret. Scopes: `playlist-read-private`, `playlist-read-collaborative`, and `user-read-recently-played`; existing connections must reconnect once to grant the added scope.
- **Secrets**: `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` live in `.env.local` only; never in parameter files.
- **Playlists**: `GET /v1/me/playlists` (owned + followed as Spotify returns them), paginated with `playlist_limit`.
- **Tracks**: `GET /v1/playlists/{id}/tracks` on expand, paginated with `tracks_limit`. No Liked Songs endpoint in this slice.
- **Recent plays**: `GET /v1/me/player/recently-played`, requested in pages of up to 50, provides track name, credited artists, and `played_at` for the local-day review queue. Plays are not persisted as history.
- **UI**: Home keeps the native playlist details accordion and adds a daily song review queue; Connect / Disconnect controls remain available.

## Relevant Files
- `src/app/page.tsx`: Home playlist browser entry (auth gate + list).
- `src/app/playlist-browser.tsx`: Client accordion for playlists and on-demand tracks.
- `src/lib/spotify/params.ts`: Reads `playlist_limit` / `tracks_limit` from the parameter file.
- `src/lib/spotify/auth.ts`: PKCE helpers, cookie token read/refresh.
- `src/lib/spotify/api.ts`: `listPlaylists`, `listPlaylistTracks`, and paginated `listRecentlyPlayed`.
- `src/app/api/spotify/login/route.ts`: Starts OAuth authorize redirect.
- `src/app/api/spotify/callback/route.ts`: Exchanges code for tokens.
- `src/app/api/spotify/logout/route.ts`: Clears auth cookies.
- `src/app/api/spotify/playlists/[id]/tracks/route.ts`: Track fetch for expanded rows.
- `parameter_files/spotify_client.toml`: Playlist/track page sizes.
- `.env.example`: Placeholder env vars for local Spotify app setup.

## Dev Mode
HACKING

## State Log
- 2026-09-05: Initialized feature file for the Spotify playlist browser client.
- 2026-09-05: Removed interview hello-world; shipped PKCE OAuth, playlist/track API helpers, and accordion browser on `/`.
- 2026-09-06: Prevented OAuth redirects with missing Spotify environment values and added local setup guidance for the Client ID and exact callback URI.
- 2026-09-06: Fixed the Spotify OAuth redirect configuration by switching the local callback URI from `localhost` to `127.0.0.1`.
- 2026-09-06: Made the configured callback origin authoritative for login, callback, and logout redirects so PKCE cookies remain available when localhost and 127.0.0.1 are mixed.
- 2026-09-06: Prevented the login route from looping when Next.js normalizes its request origin by comparing the configured host with the incoming Host header.
- 2026-09-06: Changed playlist rows to native details disclosures so they open even when client hydration is unavailable, while preserving on-demand track loading and showing request failures in the expanded panel.
- 2026-09-26: Added the recently played scope and paginated track lookup for the authenticated user's daily song collection queue.
