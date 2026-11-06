# Daily Song Reflection

## Summary
Daily song reflection enriches the authenticated Spotify review queue with a descending play-count ranking and an editor for general song notes. The notes belong to the user's song in `medley.songs`; ranking counts remain derived from Spotify and are not stored.

## Key Points
- **Listening order**: Repeated Spotify plays for the same exact title and credited artist are grouped, counted, and sorted from most to fewest plays; ties keep the first-seen order from Spotify's recent-play response.
- **Song context**: Each song review can edit free-form general notes alongside the musical and personal attributes stored on `medley.songs`.
- **Persistence**: Notes are loaded with saved song attributes and upserted on Save and next. Notes are not date-specific.
- **Access**: Notes use the existing authenticated-user row-level security on `medley.songs`.
- **Configuration**: The feature has no tunable parameters; its required parameter file is intentionally empty.

## Relevant Files
- `src/app/song-collection.tsx`: Daily play-count display, ranked review flow, and general song notes editor.
- `src/app/api/songs/collection/route.ts`: Groups and sorts plays, and returns saved song notes and attributes.
- `src/lib/songs/db.ts`: User-scoped song lookup and upsert helpers.
- `daedalus-migrations/202611061300_medley_remove_song_moments.sql`: Adds general song notes and drops the redundant table.
- `parameter_files/daily_song_reflection.toml`: Empty feature configuration.
- `feature_files/song_database.md`: Song collection data ownership and relationship to durable song attributes.

## Dev Mode
HACKING

## State Log
- 2026-11-05: Added descending daily play-count review order and date-scoped notes about why songs stood out in the moment.
- 2026-11-06: Moved notes to the general song row and removed day-specific persistence while retaining Spotify-derived ranking.
