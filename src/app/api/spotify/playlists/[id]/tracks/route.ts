import { NextResponse } from "next/server";
import { listPlaylistTracks } from "@/lib/spotify/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const tracks = await listPlaylistTracks(id);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Failed to load Spotify playlist tracks", error);
    return NextResponse.json({ error: "spotify_request_failed" }, { status: 502 });
  }
}
