import { NextResponse } from "next/server";
import { playSavedSong } from "@/lib/spotify/api";
import { getSongsForKeys } from "@/lib/songs/db";
import { getMedleyUser } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const { user } = await getMedleyUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const artist = typeof body.artist === "string" ? body.artist.trim() : "";
  if (!name || !artist) return NextResponse.json({ error: "song_required" }, { status: 400 });

  const savedSongs = await getSongsForKeys([{ name, artist }]);
  if (!savedSongs.some((song) => song.name === name && song.artist === artist)) {
    return NextResponse.json({ error: "song_not_saved" }, { status: 404 });
  }

  try {
    await playSavedSong(name, artist);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "spotify_play_failed";
    const status = message === "spotify_session_missing"
      ? 401
      : message === "spotify_track_not_found"
        ? 404
        : message.endsWith(":403")
          ? 403
          : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
