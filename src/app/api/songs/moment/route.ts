import { NextResponse } from "next/server";
import { saveSongMoment } from "@/lib/songs/db";
import { getMedleyUser } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const { user } = await getMedleyUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const moment = await request.json();
  const saved = await saveSongMoment(
    {
      name: moment.name,
      artist: moment.artist,
      day: moment.day,
      note: moment.note,
      play_count: moment.play_count,
    },
    user.id,
  );

  return NextResponse.json({ moment: saved });
}
