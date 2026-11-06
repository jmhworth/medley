import { NextResponse } from "next/server";
import { listPlaylists } from "@/lib/spotify/api";
import { getMedleyUser } from "@/lib/supabase/auth";

export async function GET() {
  const { user } = await getMedleyUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ playlists: await listPlaylists() });
  } catch (error) {
    console.error("Failed to load Spotify playlists", error);
    return NextResponse.json({ error: "spotify_request_failed" }, { status: 502 });
  }
}
