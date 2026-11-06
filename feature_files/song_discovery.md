# Song Discovery

## Summary
Song discovery turns a listener's free-form mood or activity request into up to three recommendations drawn only from their saved `medley.songs`. An authenticated Next.js route coordinates Google AI Studio Gemini function calls, keyword search through the user's Supabase session, and a bounded in-memory recommendation list; the client keeps results only for the current page session and can play a recommendation through Spotify.

## Key Points
- **Search limits**: Gemini must call the search tool with at least three distinct keywords and can search at most six per request; the server tracks and enforces distinct keyword count.
- **Query tracking**: Each completed AI keyword search is logged in the server developer console with its keyword and result count, making search effectiveness visible without logging song records.
- **Grounded results**: Search tool results are user-scoped saved songs. The save tool accepts only IDs returned by searches and caps recommendations at three.
- **Session lifetime**: Recommendations are held in client state and disappear when the page is refreshed.
- **Similar discovery**: After starting playback, the user can request similar songs; the played song and its musical and personal attributes seed the same search flow.
- **Credentials and models**: `GOOGLE_AI_STUDIO_API_KEY` is server-only and configured through the ignored environment file. The sibling parameter file orders Google AI models: Gemini 3.8 Flash, Gemini 3.5 Flash-Lite, then Gemma 4 models. HTTP 503 high-demand responses advance to the next configured model, and the request stops only after the configured model list is exhausted or another non-fallback error occurs.
- **Provider failures**: Google AI Studio rejection status and a bounded response body are logged in the Next.js server terminal; the discovery panel directs users there for diagnosis.
- **Database search**: `medley.search_my_songs` uses invoker permissions, the authenticated user ID, and the existing song table's row-level security.
- **Playback**: The Spotify endpoint checks that the requested song is saved for the signed-in user before resolving and playing its Spotify track; unmatched catalog results return a specific not-found error.

## Relevant Files
- `src/app/song-discovery.tsx`: Prompt, recommendation list, play action, and similar-song action.
- `src/app/api/songs/discover/route.ts`: Gemini tool workflow and server-side search/recommendation limits.
- `src/app/api/spotify/play/route.ts`: Authenticated saved-song playback endpoint.
- `src/lib/songs/discovery-params.ts`: Discovery parameter reader.
- `parameter_files/song_discovery.toml`: Search limits and ordered Google AI model choices.
- `daedalus-migrations/202611041930_medley_search_songs.sql`: User-scoped keyword search function.
- `src/lib/songs/db.ts`: Supabase RPC search helper.
- `src/lib/spotify/api.ts`: Spotify track resolution and playback API calls.
- `src/app/page.tsx`: Home page discovery entry; daily collection remains available.
- `feature_files/song_database.md`: Song data ownership and search relationship.
- `feature_files/spotify_client.md`: Spotify scope and playback relationship.

## Dev Mode
HACKING

## State Log
- 2026-11-04: Added mood-based search over saved songs, bounded Gemini function calling, session-only recommendations, Spotify playback, and similar-song discovery.
- 2026-11-04: Added bounded Google AI Studio failure details to server logs and a user-facing pointer to those logs for discovery 502s.
- 2026-11-04: Kept the discovery submit control enabled except during a search, avoiding prompt-dependent hydration mismatch and reporting when a prompt is empty.
- 2026-11-04: Replaced the restricted Gemini 2.5 Flash setting with current Gemini Flash and Gemma 4 model fallbacks for function-calling requests.
- 2026-11-04: Logged each AI library search keyword and its match count in the developer console for query effectiveness tracking.
- 2026-11-04: Added 503 high-demand responses to the model fallback statuses so song discovery tries each configured model before returning a provider failure.
- 2026-11-05: Improved recommendation playback matching and surfaced Spotify track lookup failures with a targeted message.
