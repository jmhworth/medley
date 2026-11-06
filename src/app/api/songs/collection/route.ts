import { NextResponse } from "next/server";
import {
  listRecentlyPlayed,
  type RecentlyPlayedTrack,
} from "@/lib/spotify/api";
import { getSongsForKeys } from "@/lib/songs/db";
import { getMedleyUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const { user } = await getMedleyUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  let played: RecentlyPlayedTrack[];
  try {
    played = await listRecentlyPlayed(start, end);
  } catch (error) {
    if (error instanceof Error && error.message === "spotify_session_missing") {
      return NextResponse.json(
        { error: "spotify_connection_required" },
        { status: 401 },
      );
    }
    console.error("Failed to fetch Spotify listening history", error);
    const status =
      error instanceof Error && error.message.includes(": 403") ? 403 : 502;
    return NextResponse.json(
      {
        error:
          status === 403
            ? "spotify_permission_required"
            : "spotify_request_failed",
      },
      { status },
    );
  }
  const unique = new Map<string, { spotify_id: string; name: string; artist: string; play_count: number; last_played: string }>();

  for (const track of played) {
    const key = track.id;
    const existing = unique.get(key);
    if (existing) {
      existing.play_count += 1;
      if (track.playedAt > existing.last_played) existing.last_played = track.playedAt;
    } else {
      unique.set(key, { spotify_id: track.id, name: track.name, artist: track.artists, play_count: 1, last_played: track.playedAt });
    }
  }

  const keys = [...unique.values()].sort(
    (first, second) => second.play_count - first.play_count || second.last_played.localeCompare(first.last_played),
  );
  let savedSongs: Awaited<ReturnType<typeof getSongsForKeys>>;
  try {
    savedSongs = await getSongsForKeys(keys);
  } catch (error) {
    console.error("Failed to load saved songs for listening history", error);
    return NextResponse.json({ error: "song_lookup_failed" }, { status: 500 });
  }
  const songs = keys.map((key) => {
    const saved = savedSongs.find(
      (song) => song.name === key.name && song.artist === key.artist,
    );
    return {
      ...key,
      musical_attributes: saved?.musical_attributes ?? [],
      personal_attributes: saved?.personal_attributes ?? [],
    };
  });

  return NextResponse.json({ songs });
}
