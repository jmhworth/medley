import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Song, SongKey } from "./types";

export async function getSongsForKeys(keys: SongKey[]) {
  if (keys.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const names = [...new Set(keys.map((key) => key.name))];
  const { data, error } = await supabase
    .from("songs")
    .select("user_id, name, artist, notes, musical_attributes, personal_attributes")
    .in("name", names);

  if (error) throw error;
  return (data ?? []) as Song[];
}

export async function searchSongsByKeyword(keyword: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("search_my_songs", {
    p_keyword: keyword,
  });

  if (error) throw error;
  return (data ?? []) as Song[];
}

export async function saveSong(
  song: Omit<Song, "user_id" | "notes"> & { notes?: string },
  userId: string,
) {
  const supabase = await createServerSupabaseClient();
  let notes = song.notes;
  if (notes === undefined) {
    const { data: existing, error: lookupError } = await supabase
      .from("songs")
      .select("notes")
      .eq("user_id", userId)
      .eq("name", song.name)
      .eq("artist", song.artist)
      .maybeSingle();
    if (lookupError) throw lookupError;
    notes = existing?.notes ?? "";
  }
  const { data, error } = await supabase
    .from("songs")
    .upsert(
      { ...song, notes, user_id: userId },
      { onConflict: "user_id,name,artist" },
    )
    .select("user_id, name, artist, notes, musical_attributes, personal_attributes")
    .single();

  if (error) throw error;
  return data as Song;
}
