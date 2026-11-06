import { NextResponse } from "next/server";
import {
  listRecentlyPlayed,
  type RecentlyPlayedTrack,
} from "@/lib/spotify/api";
import { getSongMomentsForDay, getSongsForKeys } from "@/lib/songs/db";
import { getMedleyUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const { user } = await getMedleyUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";
  const day = url.searchParams.get("day") ?? "";
  let played: RecentlyPlayedTrack[];
  try {
    played = await listRecentlyPlayed(start, end);
  } catch (error) {
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
  const unique = new Map<
    string,
    { name: string; artist: string; play_count: number }
  >();

  for (const track of played) {
    const key = `${track.name}\u0000${track.artists}`;
    const existing = unique.get(key);
    if (existing) {
      existing.play_count += 1;
    } else {
      unique.set(key, { name: track.name, artist: track.artists, play_count: 1 });
    }
  }

  const keys = [...unique.values()].sort(
    (first, second) => second.play_count - first.play_count,
  );
  const savedSongs = await getSongsForKeys(keys);
  const moments = await getSongMomentsForDay(day);
  const songs = keys.map((key) => {
    const saved = savedSongs.find(
      (song) => song.name === key.name && song.artist === key.artist,
    );
    return {
      ...key,
      musical_attributes: saved?.musical_attributes ?? [],
      personal_attributes: saved?.personal_attributes ?? [],
      moment_note: moments.find(
        (moment) => moment.song_name === key.name && moment.artist === key.artist,
      )?.note ?? "",
    };
  });

  return NextResponse.json({ day, songs });
}
