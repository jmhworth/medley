import { NextResponse } from "next/server";
import { saveSong } from "@/lib/songs/db";
import { updateMusicContextAfterFeedback } from "@/lib/songs/music-context";
import { getMedleyUser } from "@/lib/supabase/auth";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { user } = await getMedleyUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const song = await request.json();
  try {
    const saved = await saveSong(
      {
        name: song.name,
        artist: song.artist,
        musical_attributes: song.musical_attributes,
        personal_attributes: song.personal_attributes,
      },
      user.id,
    );
    try {
      await updateMusicContextAfterFeedback(
        {
          name: saved.name,
          artist: saved.artist,
          musical_attributes: saved.musical_attributes,
          personal_attributes: saved.personal_attributes,
        },
        user.id,
      );
    } catch {
      // A context refresh must not undo a song feedback save.
      console.error("Music context refresh failed after song feedback save");
    }
    return NextResponse.json({ song: saved });
  } catch (error) {
    console.error("Failed to save song", error);
    return NextResponse.json({ error: "song_save_failed" }, { status: 500 });
  }
}
