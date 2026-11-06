# Listening Workflow

## Summary
The signed-in home page is the primary entry point for listening, with Library + Search, Feedback, and Play + Feedback tabs. Spotify playlists and search recommendations provide tracks to the player; listening notes reuse each song's musical and personal attribute lists.

## Key Points
- Playlist and search selections carry Spotify track IDs into playback; saved-song search recommendations retain the saved-song ownership check.
- Feedback is based on up to 50 Spotify recently played tracks from the past 24 hours, grouped by Spotify track ID and sorted by frequency then newest play.
- Recently played is an estimate: skipped tracks and actual listening duration are not available from Spotify.
- Feedback notes are saved in the existing musical and personal attribute lists. AI-generated next-track queues are out of scope.

## Relevant Files
- `src/app/page.tsx`: Authenticated home page and tab shell.
- `src/app/listening-workspace.tsx`: Tab state, selected track, playback and feedback form.
- `src/app/song-attribute-feedback.tsx`: Shared musical and personal bullet note form.
- `src/app/playlist-browser.tsx`: Playlist track selection.
- `src/app/song-discovery.tsx`: Search recommendation selection.
- `src/app/api/spotify/playlists/route.ts`: Authenticated playlist list.
- `src/app/api/spotify/play/route.ts`: Spotify ID playback and saved-song playback.
- `src/app/api/songs/collection/route.ts`: Recently played feedback queue.
- `src/lib/spotify/api.ts`: Spotify playlist, recent play, and playback requests.

## Dev Mode
HACKING

## State Log
- 2026-11-05: Initialized the three-tab listening workflow around playlist/search entry, recent-play feedback, and selected-track playback.
- 2026-11-05: Implemented playlist and search track selection, feedback queue ordering, and reusable song attribute note capture in the three-tab home flow.
