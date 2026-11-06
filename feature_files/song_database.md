# Song Database

## Summary
The song collection system stores each user's musical and personal song attributes in `medley.songs` in Supabase. A song is identified by its exact Spotify track name and credited artist string. The authenticated home page requests the current local day's Spotify plays, joins saved attributes, and lets the user review, save, or skip songs.

## Key Points
- **Schema**: `user_id`, exact `name`, exact credited `artist`, `musical_attributes text[]`, and `personal_attributes text[]`; `(user_id, name, artist)` is unique.
- **Ownership**: Supabase row-level security scopes every database operation to the signed-in user. Authenticated server and browser clients use the `SUPABASE_SCHEMA` setting (default `medley`); Supabase must expose this schema through its Data API after migration activation.
- **Daily queue**: The browser sends its local day's UTC start and end. Repeated Spotify plays with the same name and artist are compressed into one review form; matching saved attributes are joined to that form.
- **Daily ranking and reflection**: The queue ranks grouped songs by that day's play count and stores date-specific notes separately in `medley.song_moments`; see `feature_files/daily_song_reflection.md`.
- **Review**: Inputs accept one hyphen-prefixed attribute per line. Existing populated lists are displayed and preserved; empty lists require at least one entry before save. Skip advances any song without saving, including songs the user only sampled.
- **Persistence**: Save upserts both arrays using the user/name/artist key. Spotify play timestamps are used only to select the day's queue and are not stored.
- **Feedback learning**: Successful feedback saves from both review surfaces contribute to the persistent music context cadence; context storage and interpretation belong to `feature_files/music_context.md`.
- **Discovery search**: `medley.search_my_songs` searches song names, credited artists, and both attribute arrays using the caller's authenticated identity and row-level security; see `feature_files/song_discovery.md` for recommendation behavior.
- **Configuration**: No song-store path or credentials live in `parameter_files/song_database.toml`.

## Relevant Files
- `src/lib/songs/types.ts`: Minimal song row and matching-key types.
- `src/lib/songs/db.ts`: Supabase lookup and user-scoped upsert helpers.
- `src/app/api/songs/collection/route.ts`: Loads and deduplicates daily Spotify plays, then joins saved attributes.
- `src/app/api/songs/save/route.ts`: Authenticated song attribute upsert endpoint.
- `src/lib/songs/music-context.ts`: Follow-up user context refresh after successful attribute saves.
- `src/app/song-collection.tsx`: Daily queue and bullet-list review UI.
- `src/lib/supabase/server.ts`: Cookie-authenticated Supabase client configured for the project schema.
- `daedalus-migrations/202611041700_medley_create_songs.sql`: `medley.songs`, unique key, grants, and user RLS policies.
- `src/lib/songs/index.ts`: Re-exports the song types and helpers.
- `daedalus-migrations/202611041930_medley_search_songs.sql`: Adds the invoker-secured keyword search function used by song discovery.
- `parameter_files/song_database.toml`: Empty feature configuration; no filesystem database path remains.
- `feature_files/spotify_client.md`: Spotify permissions and recently played API relationship.

## Dev Mode
HACKING

## State Log
- 2026-09-05: Initialized feature file for the file-backed song JSON database.
- 2026-09-05: Shipped Song schema, empty `data/songs.json`, params loader, and load/find/populate/attribute helpers under `src/lib/songs/`.
- 2026-09-26: Replaced the JSON scaffold with user-owned Supabase song lists, RLS, daily Spotify review queue, save/skip flow, and hyphen-bullet entry.
- 2026-09-26: Reviewed the collection implementation against the approved plan and confirmed it uses the shared cookie-authenticated Supabase session without applying migrations.
- 2026-11-04: Added the missing `medley.songs` migration after tracing the collection endpoint's uncaught lookup failure to the absent table definition in this worktree.
- 2026-11-04: Made skip available for every daily song and documented that repeated plays collapse by exact track name and credited artist into one review form.
- 2026-11-04: Added the authenticated keyword search interface used by discovery while preserving the existing saved-song ownership model.
- 2026-11-05: Kept durable song attributes separate from the daily notes and play-count ranking added by the daily reflection feature.
- 2026-11-06: Return a clear reconnect prompt when recent-play requests lack a Spotify token instead of forwarding an empty bearer token and reporting a generic gateway error.
