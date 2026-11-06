# Song Discovery

## Summary
Song discovery turns a listener's free-form mood or activity request into up to three recommendations drawn only from their saved `medley.songs`. The client coordinates short authenticated Next.js requests; each request asks Google AI Studio Gemini for one next action and carries the original prompt, completed searches, and prior recommendations forward, keeping multi-step discovery out of a single long-running function invocation.

## Key Points
- **Search limits**: Gemini must call the search tool with at least three distinct keywords before choosing suggestions and can search at most six in a discovery session; the route carries and enforces the distinct keyword list across requests.
- **Query tracking**: Each completed AI keyword search is logged in the server developer console with its keyword and result count, making search effectiveness visible without logging song records.
- **Grounded results**: Each new keyword is searched against the authenticated user's saved songs, and the client carries those returned results forward between steps. The recommendation tool accepts only a song ID found in the accumulated search results and caps recommendations at three.
- **Session lifetime**: Recommendations are held in client state and disappear when the page is refreshed.
- **Stepwise loading**: The client makes one route request per Gemini decision and appends each selected recommendation to the visible list and listening queue while it requests later recommendations.
- **Context continuity**: Each step includes the original request, any played-song seed, completed search keywords, prior recommendations, and saved-song search results retained by the client so Gemini can choose useful next keywords and recommendations without the route repeating earlier database searches.
- **Similar discovery**: After starting playback, the user can request similar songs; the played song and its musical and personal attributes seed the same search flow.
- **Credentials and models**: `GOOGLE_AI_STUDIO_API_KEY` is server-only and configured through the ignored environment file. The sibling parameter file orders Google AI models: Gemini 3.8 Flash, Gemini 3.5 Flash-Lite, then Gemma 4 models. HTTP 400, 404, 408, 503, and 504 responses and fetch-level failures advance to the next configured model; each attempt, including response-body parsing, has a configurable timeout so a stalled final response cannot consume the route's full duration.
- **Provider failures**: Google AI Studio rejection status and a bounded response body are logged in the Next.js server terminal; the discovery panel directs users there for diagnosis.
- **Function duration**: Each Vercel route invocation makes one Gemini decision; the client repeats requests until it reaches the recommendation limit or the model finds no match.
- **Database search**: `medley.search_my_songs` uses invoker permissions, the authenticated user ID, and the existing song table's row-level security.
- **Playback**: The Spotify endpoint checks that the requested song is saved for the signed-in user before resolving and playing its Spotify track; unmatched catalog results return a specific not-found error.

## Relevant Files
- `src/app/song-discovery.tsx`: Prompt, recommendation list, play action, and similar-song action.
- `src/app/listening-workspace.tsx`: Keeps discovery mounted during playback and extends the search queue as streamed recommendations arrive.
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
- 2026-11-05: Streamed discovery recommendations individually so playback can begin while later recommendations continue loading into the queue.
- 2026-11-06: Raised the discovery route's Vercel duration limit to 60 seconds to accommodate sequential Gemini tool calls and model fallbacks.
- 2026-11-05: Split discovery into one Gemini decision per request and carried prompt, search, and recommendation context forward from the client to avoid accumulating tool-call latency in a single invocation.
- 2026-11-05: Typed the accumulated search keywords as strings so the discovery route passes Vercel's TypeScript build check.
- 2026-11-06: Explicitly passed completed saved-song search results into Gemini's context so it can guide subsequent searches and recommendations.
- 2026-11-06: Returned accumulated saved-song search results to the client and reused them on later steps so each route invocation performs at most one new keyword search.
- 2026-11-06: Typed transient discovery songs and recommendations without the database-only `user_id` field so the Vercel TypeScript build accepts the route's actual response shape.
- 2026-11-06: Kept Gemini Flash models ahead of Gemma and continued through configured fallbacks when the provider returns timeout statuses or fetch fails.
- 2026-11-06: Bounded each Gemini model attempt and kept response-body parsing inside fallback handling so a stalled final response can advance to another model before Vercel times out.
