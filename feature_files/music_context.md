# Music Context

## Summary
Music context maintains a user-scoped text summary of recurring musical preferences and tentative emotional signals. Every third successful song attribute feedback save, the server asks Google AI Studio to update the existing summary using the changed song's attributes and a recent Spotify play-frequency snapshot; song discovery receives the stored summary as additional prompt context.

## Key Points
- **Counting**: Both daily feedback and Play + Feedback use `/api/songs/save`; the authenticated Supabase RPC increments a durable per-user counter atomically, and updates occur when the count is divisible by the configured interval.
- **Signals**: The update receives the just-saved song and attributes plus the three most frequently played tracks in the recent 24-hour Spotify window when available. This snapshot indicates recent listening, not lifetime preference.
- **Interpretation**: The model should distinguish repeated preference evidence from tentative emotional-state inference, preserve uncertainty, and avoid assigning tastes from generic stereotypes or one song.
- **Persistence and privacy**: Context is plain text in `medley.music_context`, protected by authenticated-user RLS. Personal context is not written to logs; provider or Spotify failures do not undo the song save.
- **Empty context**: The first due update receives an empty current context and is instructed to populate it from available evidence.
- **Provider failures**: Failed AI or Spotify calls leave the successful feedback save intact; the counter remains durable so a later third-save boundary can try again.

## Relevant Files
- `src/lib/songs/music-context.ts`: Reads, counts, and updates user-scoped context and calls Google AI Studio.
- `src/app/api/songs/save/route.ts`: Runs the context update after successful song feedback persistence.
- `src/app/api/songs/discover/route.ts`: Adds saved context to discovery model instructions.
- `src/lib/songs/db.ts`: Song attribute persistence used by both feedback surfaces.
- `src/lib/spotify/api.ts`: Recent-play source used for the frequency snapshot.
- `daedalus-migrations/202611061200_medley_create_music_context.sql`: Context table, RLS, and atomic feedback counter function.
- `parameter_files/music_context.toml`: Update interval, model order, and request timeout.
- `feature_files/song_discovery.md`: Discovery interaction and recommendation behavior.

## Dev Mode
HACKING

## State Log
- 2026-11-06: Added the persistent user-scoped music context layer, third-save AI refresh, and discovery prompt integration.
- 2026-11-06: Typed music-context feedback inputs to require only song identity and attributes, matching the evidence used to update listener context.
