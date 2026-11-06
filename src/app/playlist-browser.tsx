"use client";

import { useState } from "react";
import type { SpotifyPlaylist, SpotifyTrack } from "@/lib/spotify/api";

type PlaylistBrowserProps = {
  playlists: SpotifyPlaylist[];
  onSelectTrack?: (track: SpotifyTrack, tracks: SpotifyTrack[]) => void;
};

export function PlaylistBrowser({ playlists, onSelectTrack }: PlaylistBrowserProps) {
  const [tracksById, setTracksById] = useState<Record<string, SpotifyTrack[]>>(
    {},
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function loadPlaylistTracks(playlist: SpotifyPlaylist) {
    if (tracksById[playlist.id]) return;

    setLoadingId(playlist.id);
    setErrorId(null);

    try {
      const res = await fetch(
        `/api/spotify/playlists/${encodeURIComponent(playlist.id)}/tracks`,
      );
      if (!res.ok) throw new Error("Unable to load playlist tracks");

      const data = await res.json();
      setTracksById((prev) => ({ ...prev, [playlist.id]: data.tracks ?? [] }));
    } catch {
      setErrorId(playlist.id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="playlist-browser">
      <ul className="playlist-list">
        {playlists.map((playlist, index) => {
          const tracks = tracksById[playlist.id] ?? [];

          return (
            <li
              key={playlist.id}
              className="playlist-row"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <details
                onToggle={(event) => {
                  if (event.currentTarget.open) {
                    void loadPlaylistTracks(playlist);
                  }
                }}
              >
                <summary className="playlist-toggle">
                  <span className="playlist-chevron" aria-hidden>
                    ▸
                  </span>
                  <span className="playlist-name">{playlist.name}</span>
                  <span className="playlist-count">
                    {playlist.trackCount} tracks
                  </span>
                </summary>

                <div className="track-panel">
                  {loadingId === playlist.id ? (
                    <p className="track-status">Loading tracks…</p>
                  ) : errorId === playlist.id ? (
                    <p className="track-status">
                      Couldn&apos;t load this playlist. Try opening it again.
                    </p>
                  ) : tracks.length === 0 ? (
                    <p className="track-status">No tracks in this playlist.</p>
                  ) : (
                    <ol className="track-list">
                      {tracks.map((track, trackIndex) => (
                        <li key={`${track.id}-${trackIndex}`} className="track-row">
                          <span className="song-index">
                            {String(trackIndex + 1).padStart(2, "0")}
                          </span>
                          <div className="track-meta">
                            <span className="song-title">{track.name}</span>
                            <span className="track-artists">{track.artists}</span>
                          </div>
                          {onSelectTrack && <button className="ghost-link" type="button" onClick={() => onSelectTrack(track, tracks)}>Play</button>}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
