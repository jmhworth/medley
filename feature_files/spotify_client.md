# Spotify Client

## Summary
Connects a Spotify account via Authorization Code + PKCE (Client ID + Redirect URI only), supplies playlist and recent-play data to the listening workflow, and plays Spotify track IDs or saved song recommendations. Spotify calls use the Web API. Tokens live in HTTP-only cookies; playlist page sizes come from the feature parameter file.

## Key Points
- **OAuth**: PKCE public-client flow — no Client Secret. Scopes include `playlist-read-private`, `playlist-read-collaborative`, `user-read-recently-played`, and `user-modify-playback-state`; existing connections must disconnect and reconnect once to grant playback permission.
- **Secrets**: `SPOTIFY_CLIENT_ID` and `SPOTIFY_REDIRECT_URI` live in the ignored environment file; never in parameter files.
- **Playlists**: `GET /v1/me/playlists` (owned + followed as Spotify returns them), paginated with `playlist_limit`.
- **Tracks**: `GET /v1/playlists/{id}/tracks` on expand, paginated with `tracks_limit`. No Liked Songs endpoint in this slice.
- **Recent plays**: `GET /v1/me/player/recently-played?limit=50` provides track ID, name, credited artists, and `played_at` for the 24-hour feedback queue. Plays are not persisted as history; Spotify omits skipped tracks and listening duration.
- **Playback**: Resolves saved songs through Spotify search using normalized title and credited-artist matching, then sends the URI to `PUT /v1/me/player/play`; Spotify Premium and an active device may be required.
- **Playback**: Playlist tracks play by Spotify ID; saved song recommendations continue to be checked against the user's Medley library before playback.
- **Playback recovery**: If a play request has no Spotify token cookies, the listening workflow explains that Spotify must be reconnected and links directly to the OAuth flow.
- **UI**: The home page delegates its Library + Search, Feedback, and Play + Feedback tabs to the listening workflow. Connect / Disconnect controls remain available.

## Relevant Files
- `src/app/page.tsx`: Home discovery entry (auth gate + discovery and daily collection).
- `src/app/listening-workspace.tsx`: Three-tab listening workflow, selected-track state, and reconnect prompt for missing Spotify sessions.
- `src/app/playlist-browser.tsx`: Client accordion for playlists and on-demand tracks.
- `src/lib/spotify/params.ts`: Reads `playlist_limit` / `tracks_limit` from the parameter file.
- `src/lib/spotify/auth.ts`: PKCE helpers, cookie token read/refresh.
- `src/lib/spotify/api.ts`: `listPlaylists`, `listPlaylistTracks`, and paginated `listRecentlyPlayed`.
- `src/app/api/spotify/login/route.ts`: Starts OAuth authorize redirect.
- `src/app/api/spotify/callback/route.ts`: Exchanges code for tokens.
- `src/app/api/spotify/logout/route.ts`: Clears auth cookies.
- `src/app/api/spotify/play/route.ts`: Validates saved-song ownership before playback.
- `src/app/api/spotify/playlists/[id]/tracks/route.ts`: Track fetch for expanded rows.
- `src/app/api/spotify/playlists/route.ts`: Authenticated playlist list.
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
- 2026-11-04: Added playback scope and saved-song playback API support for discovery recommendations.
- 2026-11-05: Made Spotify search matching insensitive to accents, punctuation, whitespace, and artist order while retaining exact title and full artist-list matching.
- 2026-11-05: Added Spotify-ID playlist playback and connected the three-tab listening workflow to the shared Spotify client.
- 2026-11-05: Added a clear reconnect prompt when playback returns a missing Spotify session.
