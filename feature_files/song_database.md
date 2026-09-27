# Song Database

## Summary
The song collection system stores each user's musical and personal song attributes in `medley.songs` in Supabase. A song is identified by its exact Spotify track name and credited artist string. The authenticated home page requests the current local day's Spotify plays, joins saved attributes, and lets the user review, save, or skip songs.

## Key Points
- **Schema**: `user_id`, exact `name`, exact credited `artist`, `musical_attributes text[]`, and `personal_attributes text[]`; `(user_id, name, artist)` is unique.
- **Ownership**: Supabase row-level security scopes every database operation to the signed-in user. Authenticated server and browser clients use the `SUPABASE_SCHEMA` setting (default `medley`); Supabase must expose this schema through its Data API after migration activation.
- **Daily queue**: The browser sends its local day's UTC start and end. Repeated Spotify plays with the same name and artist are reviewed once; missing database rows return two empty lists.
- **Review**: Inputs accept one hyphen-prefixed attribute per line. Existing populated lists are displayed and preserved; empty lists require at least one entry before save. Skip is available only when both lists already contain values.
- **Persistence**: Save upserts both arrays using the user/name/artist key. Spotify play timestamps are used only to select the day's queue and are not stored.
- **Configuration**: No song-store path or credentials live in `parameter_files/song_database.toml`.

## Relevant Files
- `src/lib/songs/types.ts`: Minimal song row and matching-key types.
- `src/lib/songs/db.ts`: Supabase lookup and user-scoped upsert helpers.
- `src/app/api/songs/collection/route.ts`: Loads and deduplicates daily Spotify plays, then joins saved attributes.
- `src/app/api/songs/save/route.ts`: Authenticated song attribute upsert endpoint.
- `src/app/song-collection.tsx`: Daily queue and bullet-list review UI.
- `src/lib/supabase/server.ts`: Cookie-authenticated Supabase client configured for the project schema.
- `supabase/migrations/20260926000000_create_songs.sql`: `medley.songs`, unique key, and user RLS policies.
- `src/lib/songs/index.ts`: Re-exports the song types and helpers.
- `parameter_files/song_database.toml`: Empty feature configuration; no filesystem database path remains.
- `feature_files/spotify_client.md`: Spotify permissions and recently played API relationship.

## Dev Mode
HACKING

## State Log
- 2026-09-05: Initialized feature file for the file-backed song JSON database.
- 2026-09-05: Shipped Song schema, empty `data/songs.json`, params loader, and load/find/populate/attribute helpers under `src/lib/songs/`.
- 2026-09-26: Replaced the JSON scaffold with user-owned Supabase song lists, RLS, daily Spotify review queue, save/skip flow, and hyphen-bullet entry.
- 2026-09-26: Reviewed the collection implementation against the approved plan and confirmed it uses the shared cookie-authenticated Supabase session without applying migrations.
