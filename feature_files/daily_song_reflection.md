# Daily Song Reflection

## Summary
Daily song reflection enriches the authenticated daily Spotify review queue with a descending play-count ranking and an optional note about why each song stood out that day. Notes are stored per user, local date, and exact song title/credited artist in `medley.song_moments`, separate from enduring song attributes.

## Key Points
- **Listening order**: Repeated Spotify plays for the same exact title and credited artist are grouped, counted, and sorted from most to fewest plays; ties keep the first-seen order from Spotify's recent-play response.
- **Moment context**: Each song review asks what made the song good that day and allows a short free-form note, distinct from musical and personal attributes in `medley.songs`.
- **Date ownership**: The browser supplies its local calendar date alongside the UTC range used to fetch Spotify plays. The note is associated with that date throughout the review session.
- **Persistence**: A non-empty note is upserted on Save and next. Revisiting the same song on the same local date loads the previous note; a new date starts a new reflection.
- **Access**: `medley.song_moments` uses authenticated-user row-level security and its unique key prevents duplicate song notes for one user and day.
- **Configuration**: The feature has no tunable parameters; its required parameter file is intentionally empty.

## Relevant Files
- `src/app/song-collection.tsx`: Daily play-count display, ranked review flow, and moment prompt.
- `src/app/api/songs/collection/route.ts`: Groups and sorts plays, and returns saved notes for the requested day.
- `src/app/api/songs/moment/route.ts`: Authenticated note persistence endpoint.
- `src/lib/songs/db.ts`: User-scoped daily note lookup and upsert helpers.
- `src/app/globals.css`: Moment prompt presentation.
- `daedalus-migrations/202611052020_medley_create_song_moments.sql`: Day-scoped note table and RLS policies.
- `parameter_files/daily_song_reflection.toml`: Empty feature configuration.
- `feature_files/song_database.md`: Song collection data ownership and relationship to durable song attributes.

## Dev Mode
HACKING

## State Log
- 2026-11-05: Added descending daily play-count review order and date-scoped notes about why songs stood out in the moment.
