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
  const unique = new Map<string, (typeof played)[number]>();

  for (const track of played) {
    unique.set(`${track.name}\u0000${track.artists}`, track);
  }

  const keys = [...unique.values()].map((track) => ({
    name: track.name,
    artist: track.artists,
  }));
  const savedSongs = await getSongsForKeys(keys);
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
