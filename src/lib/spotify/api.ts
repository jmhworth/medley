import { getAccessToken } from "./auth";
import { loadSpotifyParams } from "./params";

export type SpotifyPlaylist = {
  id: string;
  name: string;
  trackCount: number;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: string;
};

export type RecentlyPlayedTrack = {
  name: string;
  artists: string;
  playedAt: string;
};

async function spotifyGet(url: string) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

export async function listPlaylists() {
  const { playlistLimit } = loadSpotifyParams();
  const playlists: SpotifyPlaylist[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/me/playlists?limit=${playlistLimit}`;

  while (url) {
    const data = await spotifyGet(url);
    for (const item of data.items ?? []) {
      playlists.push({
        id: item.id,
        name: item.name,
        trackCount: item.tracks?.total ?? 0,
      });
    }
    url = data.next;
  }

  return playlists;
}

export async function listPlaylistTracks(playlistId: string) {
  const { tracksLimit } = loadSpotifyParams();
  const tracks: SpotifyTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${tracksLimit}`;

  while (url) {
    const data = await spotifyGet(url);
    for (const item of data.items ?? []) {
      const track = item.track;
      if (!track || track.type !== "track") continue;
      tracks.push({
        id: track.id,
        name: track.name,
        artists: (track.artists ?? []).map((a: { name: string }) => a.name).join(", "),
      });
    }
    url = data.next;
  }

  return tracks;
}

export async function listRecentlyPlayed(start: string, end: string) {
  const token = await getAccessToken();
  const tracks: RecentlyPlayedTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${new Date(start).getTime() - 1}`;

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Spotify recently played request failed: ${res.status}`);
    const data = await res.json();

    for (const item of data.items ?? []) {
      const track = item.track;
      if (!track || track.type !== "track") continue;
      if (item.played_at < start || item.played_at >= end) continue;

      tracks.push({
        name: track.name,
        artists: (track.artists ?? []).map((artist: { name: string }) => artist.name).join(", "),
        playedAt: item.played_at,
      });
    }

    url = data.next;
  }

  return tracks;
}
