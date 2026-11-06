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
  id: string;
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
  if (!token) throw new Error("spotify_session_missing");
  const tracks: RecentlyPlayedTrack[] = [];
  const url = `https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${new Date(start).getTime() - 1}`;

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
      id: track.id,
      name: track.name,
      artists: (track.artists ?? []).map((artist: { name: string }) => artist.name).join(", "),
      playedAt: item.played_at,
    });
  }

  return tracks;
}

export async function playSavedSong(name: string, artist: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("spotify_session_missing");

  const query = new URLSearchParams({
    q: `track:${name} artist:${artist}`,
    type: "track",
    limit: "5",
  });
  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!searchResponse.ok) throw new Error(`spotify_search_failed:${searchResponse.status}`);
  const searchData = await searchResponse.json();
  const tracks = searchData.tracks?.items ?? [];
  const normalize = (value: string) => value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  const expectedName = normalize(name);
  const expectedArtists = JSON.stringify(artist.split(",").map(normalize).sort());
  const track = tracks.find((candidate: { name: string; artists: { name: string }[] }) =>
    normalize(candidate.name) === expectedName &&
    JSON.stringify(candidate.artists.map((item) => normalize(item.name)).sort()) === expectedArtists,
  );

  if (!track?.uri) throw new Error("spotify_track_not_found");

  const playResponse = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [track.uri] }),
  });
  if (!playResponse.ok) throw new Error(`spotify_play_failed:${playResponse.status}`);
}

export async function playSpotifyTrack(id: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("spotify_session_missing");
  const response = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ uris: [`spotify:track:${id}`] }),
  });
  if (!response.ok) throw new Error(`spotify_play_failed:${response.status}`);
}
